import { and, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";

import { getDb } from "@/lib/db";
import { networkRiskChecks } from "@/lib/db/schema";
import { getClientIp } from "@/lib/server/client-key";

type IpqsResponse = {
  success?: boolean;
  proxy?: boolean;
  vpn?: boolean;
  tor?: boolean;
  active_vpn?: boolean;
  active_tor?: boolean;
  fraud_score?: number;
};

export type FreeTrialNetworkDecision =
  | { status: "allowed"; riskType: string }
  | { status: "blocked"; riskType: string }
  | { status: "unavailable"; riskType: "configuration" | "client_ip" | "provider" };

const IPQS_TIMEOUT_MS = 7_000;

function cacheHours() {
  const parsed = Number.parseInt(process.env.IP_RISK_CACHE_HOURS || "168", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 168) : 168;
}

function riskType(payload: IpqsResponse) {
  if (payload.active_tor) return "active_tor";
  if (payload.tor) return "tor";
  if (payload.active_vpn) return "active_vpn";
  if (payload.vpn) return "vpn";
  if (payload.proxy) return "proxy";
  return "clean";
}

export function isVpnDetectionConfigured() {
  return Boolean(process.env.IPQS_API_KEY?.trim());
}

export async function checkFreeTrialNetwork({
  request,
  clientKey,
}: {
  request: NextRequest;
  clientKey: string;
}): Promise<FreeTrialNetworkDecision> {
  const clientIp = getClientIp(request);
  if (!clientIp) {
    if (process.env.NODE_ENV !== "production") {
      return { status: "allowed", riskType: "local_development" };
    }
    return { status: "unavailable", riskType: "client_ip" };
  }

  const apiKey = process.env.IPQS_API_KEY?.trim();
  if (!apiKey) {
    return { status: "unavailable", riskType: "configuration" };
  }

  const db = getDb();
  const now = new Date();
  const [cached] = await db
    .select({
      anonymousNetwork: networkRiskChecks.anonymousNetwork,
      riskType: networkRiskChecks.riskType,
    })
    .from(networkRiskChecks)
    .where(
      and(
        eq(networkRiskChecks.clientKey, clientKey),
        gt(networkRiskChecks.expiresAt, now),
      ),
    )
    .limit(1);

  if (cached) {
    return cached.anonymousNetwork
      ? { status: "blocked", riskType: cached.riskType }
      : { status: "allowed", riskType: cached.riskType };
  }

  const url = new URL(
    `https://ipqualityscore.com/api/json/ip/${encodeURIComponent(apiKey)}/${encodeURIComponent(clientIp)}`,
  );
  url.searchParams.set("strictness", "1");
  url.searchParams.set("allow_public_access_points", "true");
  url.searchParams.set("lighter_penalties", "true");
  url.searchParams.set("fast", "true");

  let payload: IpqsResponse;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(IPQS_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("VPN detection provider returned an error", response.status);
      return { status: "unavailable", riskType: "provider" };
    }

    payload = (await response.json()) as IpqsResponse;
    if (payload.success !== true) {
      console.error("VPN detection provider rejected the request");
      return { status: "unavailable", riskType: "provider" };
    }
  } catch (error) {
    console.error(
      "VPN detection provider request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { status: "unavailable", riskType: "provider" };
  }

  const detectedRisk = riskType(payload);
  const anonymousNetwork = detectedRisk !== "clean";
  const fraudScore = Number.isFinite(payload.fraud_score)
    ? Math.round(payload.fraud_score as number)
    : null;
  const checkedAt = new Date();
  const expiresAt = new Date(
    checkedAt.getTime() + cacheHours() * 60 * 60 * 1_000,
  );

  try {
    await db
      .insert(networkRiskChecks)
      .values({
        clientKey,
        anonymousNetwork,
        riskType: detectedRisk,
        fraudScore,
        checkedAt,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: networkRiskChecks.clientKey,
        set: {
          anonymousNetwork,
          riskType: detectedRisk,
          fraudScore,
          checkedAt,
          expiresAt,
        },
      });
  } catch (error) {
    console.error(
      "VPN detection cache update failed",
      error instanceof Error ? error.name : "UnknownError",
    );
  }

  return anonymousNetwork
    ? { status: "blocked", riskType: detectedRisk }
    : { status: "allowed", riskType: detectedRisk };
}
