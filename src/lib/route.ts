import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { HttpError } from "./http";

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
