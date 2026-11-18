import type { Metadata } from "next";
import { displayReference } from "@/scripture/reference";
import Link from "next/link";
import { requirePastorPage } from "@/auth/page";
import { getChurchName } from "@/churches/queries";
import { AppHeader } from "@/components/app-header";
import { ButtonLink, Card, Chip, Eyebrow, Heading, Page } from "@/components/ui";
import { Verse, VERSES } from "@/components/verse";
import { getDb } from "@/db";
import { formatSermonDate, plural } from "@/lib/format";
import { listSeries, listSermons } from "@/sermons/service";

export const metadata: Metadata = { title: "Your sermons" };

export default async function AppHome() {
  const viewer = await requirePastorPage();
  const db = getDb();
  const [churchName, sermons, series] = await Promise.all([
    getChurchName(db, viewer.churchId),
    listSermons(db, viewer),
    listSeries(db, viewer),
  ]);
  const [latest, ...earlier] = sermons;
  const openSermon = sermons.find((s) => s.status === "open");

  return (
    <>
      <AppHeader viewer={viewer} churchName={churchName} />
      <Page wide className="pt-8">
        {viewer.kind === "demo" && openSermon && (
          <Card tone="clay" className="mb-8">
            <p className="text-clay text-lg font-semibold">Try it as a church member</p>
            <p className="text-ink-muted mt-1 text-base">
              Open the reply page on your phone and send what stuck with you from &ldquo;
              {openSermon.title}&rdquo;. It shows up here.
            </p>
            <a
              href={`/r/${openSermon.publicCode}`}
              className="text-clay mt-3 inline-block font-semibold underline underline-offset-4"
            >
              Open the reply page
            </a>
          </Card>
        )}

        <div className="flex items-end justify-between gap-4">
          <Heading>Your sermons</Heading>
        </div>
        {viewer.canWrite && (
          <ButtonLink href="/app/sermons/new" full className="mt-6">
            Set up Sunday&apos;s sermon
          </ButtonLink>
        )}

        {!latest && (
          <Card className="mt-8">
            <p className="text-lg font-semibold">No sermons yet.</p>
            <p className="text-ink-muted mt-1 text-base">
              Add this Sunday&apos;s sermon and the one thing you want people to leave with.
              You&apos;ll get a QR code for the screen.
            </p>
            <Verse className="mt-6" {...VERSES.notEmpty} />
          </Card>
        )}

        {latest && (
          <section className="mt-8" aria-labelledby="latest">
            <Eyebrow>Most recent</Eyebrow>
            <SermonCard sermon={latest} large />
          </section>
        )}

        {earlier.length > 0 && (
          <section className="mt-10" aria-labelledby="earlier">
            <Heading as="h2" className="text-xl">
              <span id="earlier">Earlier</span>
            </Heading>
            <ul className="mt-3 space-y-3">
              {earlier.map((sermon) => (
                <li key={sermon.id}>
                  <SermonCard sermon={sermon} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {series.length > 0 && (
          <section className="mt-10">
            <Heading as="h2" className="text-xl">
              Series
            </Heading>
            <ul className="mt-3 space-y-2">
              {series.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/app/series/${s.id}`}
                    className="rounded-card border-line bg-surface hover:border-ink-subtle flex min-h-14 items-center justify-between border px-5 font-medium"
                  >
                    {s.title}
                    <span aria-hidden className="text-ink-subtle">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Page>
    </>
  );
}

type SermonRow = Awaited<ReturnType<typeof listSermons>>[number];

function SermonCard({ sermon, large }: { sermon: SermonRow; large?: boolean }) {
  return (
    <Link
      href={`/app/sermons/${sermon.id}`}
      className="rounded-card border-line bg-surface hover:border-ink-subtle mt-2 block border p-5 transition-colors"
    >
      <p className="text-ink-subtle text-sm">
        {formatSermonDate(sermon.preachedOn)}
        {sermon.scriptureRef && ` · ${displayReference(sermon.scriptureRef)}`}
      </p>
      <p
        className={
          large ? "mt-1 font-serif text-2xl font-medium" : "mt-1 font-serif text-xl font-medium"
        }
      >
        {sermon.title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip tone="neutral">{plural(sermon.replyCount, "reply", "replies")}</Chip>
        {sermon.questionCount > 0 && (
          <Chip tone="clay">{plural(sermon.questionCount, "question")}</Chip>
        )}
        {sermon.careCount > 0 && <Chip tone="care">{sermon.careCount} may need care</Chip>}
        {sermon.status === "open" && <Chip tone="olive">Taking replies</Chip>}
      </div>
    </Link>
  );
}
