/**
 * Runs once when the server starts.
 * 1. Validates config, so a misconfigured deploy fails immediately.
 * 2. Applies database migrations (set MIGRATE_ON_START=false to skip).
 * 3. Creates the demo church if it's missing, and builds its AI reports in
 *    the background once the AI key is set.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getEnv, features } = await import("@/lib/env");
  const env = getEnv();
  const enabled = features(env);

  const missing = Object.entries(enabled)
    .filter(([, on]) => !on)
    .map(([name]) => name);
  if (missing.length > 0) {
    console.warn(`[config] Features not configured yet: ${missing.join(", ")}`);
  }

  if (process.env.MIGRATE_ON_START === "false") return;

  const path = await import("node:path");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { getDb } = await import("@/db");
  const db = getDb();
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.info("[startup] Database is up to date.");

  const { seedDemo, generateDemoReports } = await import("@/demo/seed");
  const { created } = await seedDemo(db);
  if (created) console.info("[startup] Created the demo church.");

  if (enabled.ai) {
    const { getReportModel } = await import("@/reports/model");
    const { spendSiteBudget } = await import("@/reports/budget");
    void generateDemoReports(db, async () => {
      const model = getReportModel();
      await spendSiteBudget(db, env.IP_HASH_SALT, env.AI_DAILY_LIMIT);
      return model;
    })
      .then(
        (statuses) =>
          statuses.length && console.info(`[startup] Demo reports: ${statuses.join(", ")}`),
      )
      .catch((error: unknown) =>
        console.error(
          "[startup] Demo reports failed",
          error instanceof Error ? error.message : error,
        ),
      );
  }
}
