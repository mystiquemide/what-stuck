import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePastorPage } from "@/auth/page";
import { getChurchName } from "@/churches/queries";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { Chip, Heading, Page } from "@/components/ui";
import { getDb } from "@/db";
import { formatSermonDate, plural } from "@/lib/format";
import { HttpError } from "@/lib/http";
import { getSeriesView } from "@/sermons/series-view";

export const metadata: Metadata = { title: "Series" };

const levels = {
  close: { label: "Close", tone: "olive", width: "w-full" },
  partial: { label: "Partly", tone: "amber", width: "w-2/3" },
  different: { label: "Mostly something else", tone: "clay", width: "w-1/3" },
} as const;

export default async function SeriesPage({ params }: PageProps<"/app/series/[id]">) {
  const viewer = await requirePastorPage();
  const { id } = await params;
  const db = getDb();
  const view = await getSeriesView(db, viewer, id).catch((error: unknown) => {
    if (error instanceof HttpError) notFound();
    throw error;
  });
  const churchName = await getChurchName(db, viewer.churchId);

  return (
    <>
      <AppHeader viewer={viewer} churchName={churchName} />
      <Page wide className="pt-6">
        <BackLink href="/app">Your sermons</BackLink>
        <Heading className="mt-4">{view.series.title}</Heading>
        <p className="text-ink-muted mt-2 text-lg">How close each week got to what you meant.</p>
        <ol className="mt-8 space-y-4">
          {view.weeks.map((week, i) => {
            const level = week.alignment ? levels[week.alignment] : null;
            return (
              <li key={week.id}>
                <Link
                  href={`/app/sermons/${week.id}/report`}
                  className="rounded-card border-line bg-surface hover:border-ink-subtle block border p-5"
                >
                  <p className="text-ink-subtle text-sm">
                    Week {i + 1} · {formatSermonDate(week.preachedOn)} ·{" "}
                    {plural(week.replyCount, "reply", "replies")}
                  </p>
                  <p className="mt-1 font-serif text-xl font-medium">{week.title}</p>
                  <div className="bg-line mt-3 h-2 w-full overflow-hidden rounded-full" aria-hidden>
                    {level && (
                      <div
                        className={`h-full rounded-full ${level.width} ${level.tone === "olive" ? "bg-olive" : level.tone === "amber" ? "bg-amber" : "bg-clay"}`}
                      />
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {level ? (
                      <Chip tone={level.tone}>{level.label}</Chip>
                    ) : (
                      <Chip tone="neutral">No report yet</Chip>
                    )}
                    {week.driftCount > 0 && (
                      <Chip tone="amber">{plural(week.driftCount, "drift")}</Chip>
                    )}
                  </div>
                  {week.topThemes.length > 0 && (
                    <p className="text-ink-muted mt-3 text-base">
                      {week.topThemes.map((t) => t.label).join(" · ")}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </Page>
    </>
  );
}
