import { z } from "zod";
import { emailSchema } from "@/auth/magic-link";
import { getViewer } from "@/auth/session";
import { getDb } from "@/db";
import { teamInviteEmail } from "@/emails/team-invite";
import { getMailer } from "@/lib/email";
import { getEnv } from "@/lib/env";
import { assertSameOrigin, HttpError, readJson } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { route } from "@/lib/route";
import { addTeamMember, listTeam } from "@/team/service";

const bodySchema = z.object({ email: emailSchema });

export const GET = route(async () => {
  return Response.json({ team: await listTeam(getDb(), await getViewer()) });
});

export const POST = route(async (request: Request) => {
  const env = getEnv();
  assertSameOrigin(request, env.APP_URL);
  const { email } = await readJson(request, bodySchema);
  const db = getDb();
  const viewer = await getViewer();

  if (viewer) {
    const limit = await checkRateLimit(
      db,
      env.IP_HASH_SALT,
      { scope: "team-invite", limit: 20, windowMs: 86_400_000 },
      viewer.churchId,
    );
    if (!limit.allowed)
      throw new HttpError(429, "You've added a lot of people today. Try again tomorrow.");
  }

  const member = await addTeamMember(db, viewer, email);
  // The invite is a courtesy. If email isn't set up, they can still sign in from the home page.
  await getMailer()
    .send(
      teamInviteEmail({
        to: member.email,
        churchName: member.churchName,
        signInUrl: `${env.APP_URL}/login`,
      }),
    )
    .catch((error: unknown) =>
      console.warn("[team] invite email not sent", error instanceof Error ? error.message : error),
    );
  return Response.json(
    { member: { userId: member.userId, email: member.email, role: "editor" } },
    { status: 201 },
  );
});
