import type { Metadata } from "next";
import { displayReference } from "@/scripture/reference";
import { notFound } from "next/navigation";
import { requirePastorPage } from "@/auth/page";
import { getChurchName } from "@/churches/queries";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { LiveRefresh } from "@/components/live-refresh";
import { ButtonLink, Card, Chip, Eyebrow, Heading, Page } from "@/components/ui";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { formatSermonDate, plural } from "@/lib/format";
import { HttpError } from "@/lib/http";
import { getSermonForViewer, publicReplyUrl } from "@/sermons/service";
import { BulletinKit } from "./bulletin-kit";
import { ReflectionEditor } from "./reflection-editor";
import { ShareActions } from "./share-actions";

export const metadata: Metadata = { title: "Sermon" };

export default async function SermonPage({ params }: PageProps<"/app/sermons/[id]">) {
  const viewer = await requirePastorPage();
  const { id } = await params;
  const db = getDb();
  const sermon = await getSermonForViewer(db, viewer, id).catch((error: unknown) => {
    if (error instanceof HttpError) notFound();
    throw error;
  });
  const churchName = await getChurchName(db, viewer.churchId);
  const replyUrl = publicReplyUrl(getEnv().APP_URL, sermon.publicCode);

  return (
    <>
      <AppHeader viewer={viewer} churchName={churchName} />
      <Page wide className="pt-6">
        {sermon.status === "open" && <LiveRefresh />}
        <BackLink href="/app">Your sermons</BackLink>
        <p className="text-ink-subtle mt-4 text-sm">
          {formatSermonDate(sermon.preachedOn, true)}
          {sermon.scriptureRef && ` · ${displayReference(sermon.scriptureRef)}`}
        </p>
        <Heading className="mt-1">{sermon.title}</Heading>
        <Card className="mt-6">
          <Eyebrow>What you want them to leave with</Eyebrow>
          <p className="mt-1 font-serif text-xl leading-snug">{sermon.intendedTakeaway}</p>
        </Card>

        <section className="mt-6 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="rounded-card border-line bg-surface mx-auto border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- private, generated per sermon */}
            <img
              src={`/api/sermons/${sermon.id}/qr`}
              width={220}
              height={220}
              alt={`QR code that opens ${replyUrl}`}
              className="size-[220px]"
            />
          </div>
          <div>
            <Eyebrow>Put this on the screen at the end of the sermon</Eyebrow>
            <p className="mt-1 font-medium break-all">{replyUrl.replace(/^https?:\/\//, "")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone="neutral">
                <span aria-live="polite">{plural(sermon.replyCount, "reply", "replies")}</span>
              </Chip>
              {sermon.careCount > 0 && <Chip tone="care">{sermon.careCount} may need care</Chip>}
            </div>
            <ShareActions
              sermonId={sermon.id}
              replyUrl={replyUrl}
              status={sermon.status}
              canWrite={viewer.canWrite}
            />
          </div>
        </section>

        <ButtonLink href={`/app/sermons/${sermon.id}/report`} full className="mt-8">
          Read what stuck
        </ButtonLink>

        {sermon.status === "open" && <BulletinKit replyUrl={replyUrl} sermonTitle={sermon.title} />}

        <ReflectionEditor
          sermonId={sermon.id}
          initialQuestion={sermon.reflectionQuestion}
          initiallyApproved={Boolean(sermon.reflectionApprovedAt)}
          canWrite={viewer.canWrite}
        />
      </Page>
    </>
  );
}
