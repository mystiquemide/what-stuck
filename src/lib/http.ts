import "server-only";
import { z } from "zod";

/** An error that is safe to show to the caller. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export const unauthorized = () =>
  new HttpError(401, "Your sign-in has ended. Sign in again to keep going.");
export const forbidden = (message = "You don't have access to this.") =>
  new HttpError(403, message);
export const notFound = (what = "We couldn't find that. It may have been removed.") =>
  new HttpError(404, what);

/** Parse a JSON body against a schema. Bad JSON and bad shapes both become a 400. */
export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "We couldn't read that. Refresh the page and try again.");
  }
  return schema.parse(body);
}

/**
 * Cookie-authenticated writes must come from our own pages. SameSite=Lax cookies
 * already block most cross-site posts; this closes the rest.
 */
export function assertSameOrigin(request: Request, appUrl: string): void {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(appUrl).origin) {
    throw forbidden(
      "For your safety, this only works from the What Stuck site. Refresh the page and try again.",
    );
  }
}

/**
 * Client IP for rate limiting. Behind the Dokploy/Traefik proxy, the first
 * X-Forwarded-For entry is the client. Only used as input to a keyed hash.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Route params that should be UUIDs. Anything else is simply "not found". */
export function uuidParam(value: string): string {
  const parsed = z.uuid().safeParse(value);
  if (!parsed.success) throw notFound();
  return parsed.data;
}
