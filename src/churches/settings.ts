import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertCanRead, assertOwner, type Viewer } from "@/auth/access";
import type { Database } from "@/db";
import { churches } from "@/db/schema";

/** A link to the church's own form. Empty means "not set". Only https, so members never land on an insecure page. */
const formLink = z
  .string()
  .trim()
  .max(500, "Keep the link under 500 characters.")
  .optional()
  .transform((v) => v || null)
  .refine((v) => v === null || isHttpsUrl(v), "Paste the full link, starting with https://");

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const churchSettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter your church's name.").max(100),
  careContact: z
    .string()
    .trim()
    .max(120, "Keep it under 120 characters.")
    .optional()
    .transform((v) => v || null),
  careFormUrl: formLink,
  connectFormUrl: formLink,
});

export type ChurchSettings = z.output<typeof churchSettingsSchema>;

const columns = {
  name: churches.name,
  careContact: churches.careContact,
  careFormUrl: churches.careFormUrl,
  connectFormUrl: churches.connectFormUrl,
};

export async function getChurchSettings(db: Database, viewer: Viewer): Promise<ChurchSettings> {
  assertCanRead(viewer, viewer.churchId);
  const [row] = await db.select(columns).from(churches).where(eq(churches.id, viewer.churchId));
  if (!row) throw new Error("Church not found");
  return row;
}

/** Only the pastor who set up the church can change what members see. */
export async function updateChurchSettings(
  db: Database,
  viewer: Viewer | null,
  input: ChurchSettings,
): Promise<ChurchSettings> {
  assertOwner(viewer, viewer?.churchId ?? "");
  const [row] = await db
    .update(churches)
    .set(input)
    .where(eq(churches.id, viewer.churchId))
    .returning(columns);
  if (!row) throw new Error("Church not found");
  return row;
}
