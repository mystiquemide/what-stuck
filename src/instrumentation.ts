/**
 * Runs once when the server starts. Validating config here means a
 * misconfigured deploy fails immediately instead of on the first request.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getEnv, features } = await import("@/lib/env");
  const enabled = features(getEnv());

  const missing = Object.entries(enabled)
    .filter(([, on]) => !on)
    .map(([name]) => name);
  if (missing.length > 0) {
    console.warn(`[config] Features not configured yet: ${missing.join(", ")}`);
  }
}
