import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { churches } from "@/db/schema";

export async function getChurchName(db: Database, churchId: string) {
  const [row] = await db
    .select({ name: churches.name })
    .from(churches)
    .where(eq(churches.id, churchId));
  return row?.name ?? "";
}
