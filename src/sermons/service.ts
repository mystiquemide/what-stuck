import { and, desc, eq, sql } from "drizzle-orm";
import { assertCanRead, assertCanWrite, requireViewer, type Viewer } from "@/auth/access";
import type { Database } from "@/db";
import { churches, responses, series, sermons } from "@/db/schema";
import { generatePublicCode } from "@/lib/codes";
import { HttpError, notFound } from "@/lib/http";
import type { CreateSermonInput, UpdateSermonInput } from "./schemas";

const replyCounts = {
  replyCount: sql<number>`count(${responses.id}) filter (where not ${responses.hidden})::int`,
  careCount: sql<number>`count(${responses.id}) filter (where ${responses.careFlag} and not ${responses.hidden})::int`,
  questionCount: sql<number>`count(${responses.question}) filter (where not ${responses.hidden})::int`,
};

export async function listSermons(db: Database, maybeViewer: Viewer | null) {
  const viewer = requireViewer(maybeViewer);
  return db
    .select({
      id: sermons.id,
      title: sermons.title,
      preachedOn: sermons.preachedOn,
      scriptureRef: sermons.scriptureRef,
      status: sermons.status,
      seriesId: sermons.seriesId,
      publicCode: sermons.publicCode,
      ...replyCounts,
    })
    .from(sermons)
    .leftJoin(responses, eq(responses.sermonId, sermons.id))
    .where(eq(sermons.churchId, viewer.churchId))
    .groupBy(sermons.id)
    .orderBy(desc(sermons.preachedOn), desc(sermons.createdAt));
}

/** Load a sermon and confirm the viewer may read it. Unknown and foreign IDs look the same. */
export async function getSermonForViewer(db: Database, viewer: Viewer | null, sermonId: string) {
  const [row] = await db
    .select({ sermon: sermons, ...replyCounts })
    .from(sermons)
    .leftJoin(responses, eq(responses.sermonId, sermons.id))
    .where(eq(sermons.id, sermonId))
    .groupBy(sermons.id);
  requireViewer(viewer);
  if (!row) throw notFound();
  assertCanRead(viewer, row.sermon.churchId);
  return {
    ...row.sermon,
    replyCount: row.replyCount,
    careCount: row.careCount,
    questionCount: row.questionCount,
  };
}

async function assertSeriesInChurch(
  db: Database,
  churchId: string,
  seriesId: string | null | undefined,
) {
  if (!seriesId) return;
  const [found] = await db
    .select({ id: series.id })
    .from(series)
    .where(and(eq(series.id, seriesId), eq(series.churchId, churchId)));
  if (!found) throw new HttpError(400, "That series isn't available anymore. Pick another one.");
}

/** Postgres unique-violation, whether the driver error is thrown directly or wrapped. */
function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } } | undefined;
  return (e?.code ?? e?.cause?.code) === "23505";
}

export async function createSermon(
  db: Database,
  maybeViewer: Viewer | null,
  input: CreateSermonInput,
) {
  const viewer = requireViewer(maybeViewer);
  assertCanWrite(viewer, viewer.churchId);
  await assertSeriesInChurch(db, viewer.churchId, input.seriesId);

  // Codes are random over ~8.5e11 values; a retry covers the rare collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const [sermon] = await db
        .insert(sermons)
        .values({ ...input, churchId: viewer.churchId, publicCode: generatePublicCode() })
        .returning();
      if (!sermon) throw new Error("Insert returned nothing.");
      return sermon;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 2) throw error;
    }
  }
  throw new Error("unreachable");
}

export async function updateSermon(
  db: Database,
  viewer: Viewer | null,
  sermonId: string,
  input: UpdateSermonInput,
) {
  const sermon = await getSermonForViewer(db, viewer, sermonId);
  assertCanWrite(viewer, sermon.churchId);
  await assertSeriesInChurch(db, sermon.churchId, input.seriesId);

  const changes = { ...input };
  // A new intended point means the old reflection question may no longer fit.
  if (input.intendedTakeaway && input.intendedTakeaway !== sermon.intendedTakeaway) {
    Object.assign(changes, { reflectionApprovedAt: null });
  }

  const [updated] = await db
    .update(sermons)
    .set(changes)
    .where(eq(sermons.id, sermonId))
    .returning();
  return updated!;
}

export async function listSeries(db: Database, maybeViewer: Viewer | null) {
  const viewer = requireViewer(maybeViewer);
  return db
    .select({ id: series.id, title: series.title, createdAt: series.createdAt })
    .from(series)
    .where(eq(series.churchId, viewer.churchId))
    .orderBy(desc(series.createdAt));
}

export async function createSeries(db: Database, maybeViewer: Viewer | null, title: string) {
  const viewer = requireViewer(maybeViewer);
  assertCanWrite(viewer, viewer.churchId);
  const [row] = await db.insert(series).values({ churchId: viewer.churchId, title }).returning();
  return row!;
}

/** What a member sees on the reply page. Nothing private. */
export async function getPublicSermon(db: Database, code: string) {
  const [row] = await db
    .select({
      id: sermons.id,
      title: sermons.title,
      scriptureRef: sermons.scriptureRef,
      preachedOn: sermons.preachedOn,
      status: sermons.status,
      churchName: churches.name,
      churchTimezone: churches.timezone,
      churchCareContact: churches.careContact,
    })
    .from(sermons)
    .innerJoin(churches, eq(churches.id, sermons.churchId))
    .where(eq(sermons.publicCode, code));
  return row ?? null;
}

export function publicReplyUrl(appUrl: string, code: string) {
  return `${appUrl}/r/${code}`;
}
