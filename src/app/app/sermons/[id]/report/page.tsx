import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePastorPage } from "@/auth/page";
import { getChurchName } from "@/churches/queries";
import { AppHeader } from "@/components/app-header";
import { BackLink } from "@/components/back-link";
import { Card, Chip, Eyebrow, Heading, Page, Quote } from "@/components/ui";
import { Verse, VERSES } from "@/components/verse";
import { getDb } from "@/db";
import { formatSermonDate, plural } from "@/lib/format";
import { HttpError } from "@/lib/http";
import type { ReportBody } from "@/reports/schema";
import { getReport, REPORT_FAILED_MESSAGE } from "@/reports/service";
import { GenerateButton } from "./generate-button";
import { ReplyList } from "./reply-list";
import { YouAsked } from "./you-asked";

export const metadata: Metadata = { title: "What stuck" };

const alignmentCopy = {
  close: { label: "Close", tone: "olive", line: "Most people heard what you meant." },
  partial: {
    label: "Partly",
    tone: "amber",
    line: "Some heard it. Others heard something nearby.",
  },
  different: {
    label: "Mostly something else",
    tone: "clay",
    line: "Most heard something other than your point.",
  },
} as const;

export default async function ReportPage({ params }: PageProps<"/app/sermons/[id]/report">) {
  const viewer = await requirePastorPage();
  const { id } = await params;
  const db = getDb();
  const data = await getReport(db, viewer, id).catch((error: unknown) => {
    if (error instanceof HttpError) notFound();
    throw error;
  });
  const churchName = await getChurchName(db, viewer.churchId);
  const { sermon, report, replies, canGenerate } = data;
  const visible = replies.filter((r) => !r.hidden);
  const byId = new Map(replies.map((r) => [r.id, r]));
  const body = report?.status === "ready" ? (report.body as ReportBody) : null;

  return (
    <>
      <AppHeader viewer={viewer} churchName={churchName} />
      <Page wide className="pt-6">
        <BackLink href={`/app/sermons/${sermon.id}`}>{sermon.title}</BackLink>
        <p className="text-ink-subtle mt-4 text-sm">
          {formatSermonDate(sermon.preachedOn, true)}
          {sermon.scriptureRef && ` · ${sermon.scriptureRef}`} ·{" "}
          {plural(visible.length, "reply", "replies")}
        </p>
        <Heading className="mt-1">What stuck</Heading>

        {!body && (
          <Card className="mt-6">
            {!canGenerate ? (
              <>
                <p className="text-lg font-semibold">Not enough replies for a report yet.</p>
                <p className="text-ink-muted mt-1 text-base">
                  With fewer than 3 replies there&apos;s no real pattern to find, so here they are
                  as written.
                </p>
              </>
            ) : report?.status === "failed" ? (
              <>
                <p className="text-lg font-semibold">The last report didn&apos;t work.</p>
                <p className="text-ink-muted mt-1 text-base">{REPORT_FAILED_MESSAGE}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">
                  {plural(visible.length, "person", "people")} replied.
                </p>
                <p className="text-ink-muted mt-1 text-base">
                  Build the report to see what landed, where it drifted, and what people are still
                  asking.
                </p>
              </>
            )}
            {canGenerate && viewer.canWrite && (
              <GenerateButton sermonId={sermon.id} label="Build the report" />
            )}
            {canGenerate && !viewer.canWrite && (
              <p className="text-ink-subtle mt-3 text-sm">
                This is a demo church, so reports can&apos;t be rebuilt here.
              </p>
            )}
          </Card>
        )}

        {body && report && (
          <>
            <p className="no-print text-ink-subtle mt-3 text-sm">
              Organized by AI from{" "}
              {plural(report.responseCount, "anonymous reply", "anonymous replies")}. Every theme
              links to the real replies, and all of them are at the bottom.
            </p>

            {report.stale && viewer.canWrite && (
              <Card tone="amber" className="no-print mt-4">
                <p className="text-amber font-semibold">New replies came in after this report.</p>
                <GenerateButton
                  sermonId={sermon.id}
                  label="Update the report"
                  variant="secondary"
                />
              </Card>
            )}

            {body.care.length > 0 && (
              <section aria-labelledby="care" className="mt-6">
                <Card tone="care">
                  <h2 id="care" className="text-care text-lg font-semibold">
                    {body.care.length === 1
                      ? "One reply may need your care"
                      : `${body.care.length} replies may need your care`}
                  </h2>
                  <p className="text-ink-muted mt-1 text-sm">
                    These are anonymous. The person saw crisis resources and your care contact when
                    they sent it. Consider naming care openly from the front this Sunday.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {body.care.map((c) => {
                      const reply = byId.get(c.replyId);
                      return reply ? (
                        <li key={c.replyId}>
                          <Quote className="border-care/20">{reply.takeaway}</Quote>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </Card>
              </section>
            )}

            <section aria-labelledby="said-heard" className="mt-6">
              <Card>
                <h2 id="said-heard" className="sr-only">
                  What you said and what they heard
                </h2>
                <Eyebrow>You said</Eyebrow>
                <p className="mt-1 font-serif text-xl leading-snug">{sermon.intendedTakeaway}</p>
                <div className="border-line my-5 border-t" />
                <div className="flex flex-wrap items-center gap-2">
                  <Eyebrow>They heard</Eyebrow>
                  <Chip tone={alignmentCopy[body.alignment.level].tone}>
                    {alignmentCopy[body.alignment.level].label}
                  </Chip>
                </div>
                <p className="mt-2 text-lg font-medium">
                  {alignmentCopy[body.alignment.level].line}
                </p>
                <p className="text-ink-muted mt-1 text-base">{body.alignment.reason}</p>
                <p className="text-ink mt-4 font-serif text-lg leading-snug">{body.summary}</p>
              </Card>
            </section>

            <section aria-labelledby="themes" className="mt-10">
              <Heading as="h2">
                <span id="themes">What stuck</span>
              </Heading>
              <ol className="mt-4 space-y-4">
                {body.themes.map((theme) => {
                  const quotes = theme.replyIds
                    .map((rid) => byId.get(rid))
                    .filter((r) => r && !r.hidden);
                  return (
                    <li key={theme.label}>
                      <Card>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-serif text-xl leading-snug font-medium">
                            {theme.label}
                          </h3>
                          <Chip tone="neutral">{theme.count}</Chip>
                        </div>
                        <p className="text-ink-muted mt-1 text-base">{theme.summary}</p>
                        <ul className="mt-3 space-y-2">
                          {quotes.slice(0, 2).map((r) => (
                            <li key={r!.id}>
                              <Quote className="bg-paper">{r!.takeaway}</Quote>
                            </li>
                          ))}
                        </ul>
                        {quotes.length > 2 && (
                          <details className="mt-2">
                            <summary className="text-clay min-h-11 cursor-pointer py-2 text-base font-medium">
                              See {quotes.length - 2} more
                            </summary>
                            <ul className="space-y-2">
                              {quotes.slice(2).map((r) => (
                                <li key={r!.id}>
                                  <Quote className="bg-paper">{r!.takeaway}</Quote>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ol>
            </section>

            {body.drift.length > 0 && (
              <section aria-labelledby="drift" className="mt-10">
                <Heading as="h2">
                  <span id="drift">Where it drifted</span>
                </Heading>
                <p className="text-ink-muted mt-1 text-base">
                  Things people heard that you didn&apos;t mean.
                </p>
                <ul className="mt-4 space-y-3">
                  {body.drift.map((d) => {
                    const example = d.replyIds
                      .map((rid) => byId.get(rid))
                      .find((r) => r && !r.hidden);
                    return (
                      <li key={d.heard}>
                        <Card tone="amber">
                          <p className="text-lg font-medium">{d.heard}</p>
                          <p className="text-ink-muted mt-1 text-sm">
                            {plural(d.count, "reply", "replies")}
                          </p>
                          {example && <Quote className="mt-3">{example.takeaway}</Quote>}
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {body.questions.length > 0 && (
              <section aria-labelledby="questions" className="mt-10">
                <Heading as="h2">
                  <span id="questions">Questions people are carrying</span>
                </Heading>
                <YouAsked
                  sermonTitle={sermon.title}
                  questions={body.questions.map((q) => ({
                    question: q.question,
                    smallGroupPrompt: q.smallGroupPrompt,
                    count: q.count,
                  }))}
                />
              </section>
            )}
          </>
        )}

        <section aria-labelledby="all" className="mt-10">
          <Heading as="h2">
            <span id="all">Every reply</span>
          </Heading>
          <p className="text-ink-muted mt-1 text-base">Exactly as people wrote them.</p>
          <ReplyList
            replies={replies.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
            canWrite={viewer.canWrite}
          />
        </section>

        <Verse className="no-print mt-12" {...VERSES.notEmpty} />

        {body && report && (
          <footer className="border-line text-ink-subtle mt-10 border-t pt-4 text-sm">
            <p>
              Built{" "}
              {report.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
              with {report.model}, prompt {report.promptVersion}.
            </p>
            {viewer.canWrite && !report.stale && (
              <GenerateButton sermonId={sermon.id} label="Rebuild the report" variant="quiet" />
            )}
          </footer>
        )}
      </Page>
    </>
  );
}
