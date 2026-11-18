import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { HttpError } from "./http";

const UNREADABLE = "We couldn't read that. Refresh the page and try again.";

/**
 * Our schemas carry plain-language messages. Anything that still has a
 * library default ("Invalid input: expected string") gets a calm fallback,
 * so people never see technical wording.
 */
export function friendlyMessage(message: string) {
  return /^(Invalid|Too (big|small)|Expected|Unrecognized|Required)/i.test(message)
    ? "Check this answer and try again."
    : message;
}

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
        const fields = error.issues
          .filter((i) => i.path.length > 0)
          .map((i) => ({ path: i.path.join("."), message: friendlyMessage(i.message) }));
        return Response.json(
          {
            error: fields.length ? "Check the highlighted answers and try again." : UNREADABLE,
            fields,
          },
          { status: 400 },
        );
      }
      console.error("[route] unexpected error", error);
      return Response.json(
        { error: "Something went wrong on our side. Try again in a moment." },
        { status: 500 },
      );
    }
  };
}
