import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { sermons } from "@/db/schema";
import { PUBLIC_CODE_PATTERN } from "@/lib/codes";

export const config = { matcher: "/r/:code" };

/**
 * Reply pages stream, so a missing sermon would otherwise answer 200.
 * Check the code first (one indexed lookup) and serve the not-found page with a real 404.
 */
export async function proxy(request: NextRequest) {
  const code = request.nextUrl.pathname.split("/")[2] ?? "";
  if (PUBLIC_CODE_PATTERN.test(code)) {
    const [hit] = await getDb()
      .select({ id: sermons.id })
      .from(sermons)
      .where(eq(sermons.publicCode, code))
      .limit(1);
    if (hit) return NextResponse.next();
  }
  return NextResponse.rewrite(new URL("/reply-not-found", request.url), { status: 404 });
}
