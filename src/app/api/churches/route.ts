import { z } from "zod";
import { createChurchForUser, staffViewer } from "@/auth/access";
import { getCurrentUser } from "@/auth/session";
import { getDb } from "@/db";
import { generatePublicCode } from "@/lib/codes";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, HttpError, readJson, route, unauthorized } from "@/lib/http";

const bodySchema = z.object({
  name: z.string().trim().min(2, "Enter your church's name.").max(100),
  timezone: z
    .string()
    .refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz), "Pick a valid time zone."),
});

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "church"}-${generatePublicCode(4)}`;
}

/** First-time setup: a signed-in pastor with no church creates one and becomes its owner. */
export const POST = route(async (request: Request) => {
  assertSameOrigin(request, getEnv().APP_URL);
  const user = await getCurrentUser();
  if (!user) throw unauthorized();

  const db = getDb();
  if (await staffViewer(db, user)) throw new HttpError(409, "You already have a church set up.");

  const { name, timezone } = await readJson(request, bodySchema);
  const church = await createChurchForUser(db, user.id, { name, timezone, slug: slugify(name) });
  return Response.json({ church: { id: church.id, name: church.name } }, { status: 201 });
});
