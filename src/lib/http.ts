import "server-only";
import { unstable_rethrow } from "next/navigation";
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

export const unauthorized = () => new HttpError(401, "Please sign in.");
export const forbidden = (message = "You don't have access to this.") =>
  new HttpError(403, message);
export const notFound = (what = "Not found.") => new HttpError(404, what);

/**
 * Wraps a route handler: known errors become clean JSON, anything else is
 * logged on the server and returned as a generic 500 with no internals.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Let Next.js handle its own control-flow signals (redirects, dynamic bailouts).
      unstable_rethrow(error);
      if (error instanceof HttpError) {
        return Response.json({ error: error.message, ...error.extra }, { status: error.status });
      }
      if (error instanceof z.ZodError) {
        return Response.json(
          {
            error: "Some fields need another look.",
            fields: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          },
          { status: 400 },
        );
      }
      console.error("[route] unexpected error", error);
      return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

/** Parse a JSON body against a schema. Bad JSON and bad shapes both become a 400. */
export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.");
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
    throw forbidden("Cross-site request blocked.");
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
