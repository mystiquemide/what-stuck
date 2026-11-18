import { eq } from "drizzle-orm";
import { getCurrentUser, getViewer } from "@/auth/session";
import { getDb, schema } from "@/db";
import { route } from "@/lib/route";

export const GET = route(async () => {
  const viewer = await getViewer();
  if (!viewer) {
    const user = await getCurrentUser();
    return Response.json({ signedIn: Boolean(user), needsChurch: Boolean(user), viewer: null });
  }

  const [church] = await getDb()
    .select({
      id: schema.churches.id,
      name: schema.churches.name,
      timezone: schema.churches.timezone,
    })
    .from(schema.churches)
    .where(eq(schema.churches.id, viewer.churchId));

  return Response.json({
    signedIn: viewer.kind === "staff",
    needsChurch: false,
    viewer: {
      kind: viewer.kind,
      canWrite: viewer.canWrite,
      email: viewer.kind === "staff" ? viewer.user.email : null,
      church,
    },
  });
});
