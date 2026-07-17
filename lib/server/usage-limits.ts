export const FREE_PREVIEW_LIMIT = 2;

export function dailyGenerationLimit() {
  const parsed = Number.parseInt(process.env.DAILY_GENERATION_LIMIT || "20", 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 10_000) : 20;
}
