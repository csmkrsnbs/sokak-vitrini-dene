export function getPreviewJobMaxAgeMs() {
  const parsed = Number.parseInt(process.env.PREVIEW_JOB_MAX_AGE_MS || "1200000", 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 300_000), 3_600_000)
    : 1_200_000;
}
