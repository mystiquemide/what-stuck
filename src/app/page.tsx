import Link from "next/link";
import {
  EmailShot,
  PhoneReply,
  ReportShot,
  ReportSlice,
  SlideShot,
} from "@/components/landing/product-shots";
import { Logo } from "@/components/logo";

const week = [
  {
    day: "Sunday",
    title: "One question on the screen",
    body: "Write the one thing you want people to leave with. At the end of the sermon, put up the slide. People scan and answer in their own words. No app, no account, no names.",
    shot: "slide",
  },
  {
    day: "Monday",
    title: "A report you can read with your coffee",
    body: "See how close the room got to your point, the themes in their own words, where it drifted, and the questions they're still carrying. Replies that sound like someone is hurting come first.",
    shot: "report",
  },
  {
    day: "Wednesday",
    title: "Their words, back to them",
    body: "Anyone who asked gets one email: what they said on Sunday, the passage, and a question you approved. The sermon keeps working halfway through the week.",
    shot: "email",
  },
] as const;

const does = [
  "Groups replies into themes, each backed by real quotes",
  "Shows where people heard something you didn't mean",
  "Puts replies that may need care at the top",
  "Turns questions into next Sunday's bulletin and small-group prompts",
];

const never = [
  "Grades your preaching",
  "Asks members for their names",
  "Invents a quote or a number. Every theme links to real replies",
  "Writes Scripture. Passages come from a licensed Bible",
  "Sends anything you haven't approved",
];

const buttonPrimary =
  "inline-flex min-h-14 items-center justify-center rounded-button bg-ink px-7 text-lg font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-ink/90 hover:shadow-[0_10px_24px_-12px_rgba(28,25,23,0.6)] motion-reduce:hover:translate-y-0";
const buttonSecondary =
  "inline-flex min-h-14 items-center justify-center rounded-button border-[1.5px] border-line bg-surface px-7 text-lg font-semibold text-ink transition hover:border-ink-subtle";

export default function Home() {
  return (
    <div className="flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
        <Link href="/" aria-label="What Stuck home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-base font-medium">
          <Link
            href="/demo"
            className="text-ink-muted hover:text-ink hidden min-h-11 items-center rounded-lg px-3 sm:flex"
          >
            See the demo
          </Link>
          <Link
            href="/login"
            className="text-ink-muted hover:text-ink flex min-h-11 items-center rounded-lg px-3"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-14 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div>
            <p className="text-clay text-sm font-semibold tracking-[0.12em] uppercase">
              For pastors and the people they preach to
            </p>
            <h1 className="mt-5 font-serif text-[2.75rem] leading-[1.04] font-medium tracking-[-0.02em] sm:text-[3.75rem]">
              Find out what your church{" "}
              <span className="relative whitespace-nowrap">
                actually
                <svg
                  aria-hidden
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="text-clay absolute -bottom-1 left-0 h-3 w-full"
                >
                  <path
                    d="M2 9c40-6 95-8 196-3"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              took home from Sunday.
            </h1>
            <p className="text-ink-muted mt-6 max-w-xl text-xl leading-relaxed">
              Pastors preach every week and hear &ldquo;good sermon&rdquo; at the door. What Stuck
              asks the room one question after the sermon, and on Monday shows you what landed, what
              drifted, and who might need you.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className={buttonPrimary}>
                Open the demo church
              </Link>
              <Link href="/login" className={buttonSecondary}>
                Start for your church
              </Link>
            </div>
            <p className="text-ink-subtle mt-4 text-sm">
              Free. Nothing to install. Works on any phone.
            </p>
          </div>

          <div className="relative mx-auto flex w-full max-w-[520px] justify-center lg:justify-end">
            <PhoneReply />
            <ReportSlice className="absolute -bottom-16 left-0 hidden sm:block lg:-left-10" />
          </div>
        </section>

        <section aria-label="Scripture" className="border-line bg-surface border-y">
          <figure className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
            <blockquote className="font-serif text-[1.75rem] leading-snug font-medium tracking-[-0.01em] sm:text-[2.25rem]">
              &ldquo;Consequently, faith comes by hearing, and hearing by the word of Christ.&rdquo;
            </blockquote>
            <figcaption className="text-ink-subtle mt-5 text-base">
              Romans 10:17, Berean Standard Bible
            </figcaption>
            <p className="text-ink-muted mx-auto mt-8 max-w-xl text-lg">
              Preaching is half of a conversation. What Stuck gives you the other half: what people
              actually heard.
            </p>
          </figure>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
          <p className="text-clay text-sm font-semibold tracking-[0.12em] uppercase">
            How a week works
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-[2.25rem] leading-tight font-medium tracking-[-0.015em]">
            Three moments. About two minutes of your time.
          </h2>
          <ol className="mt-12 grid gap-12 lg:grid-cols-3 lg:gap-8">
            {week.map((step) => (
              <li key={step.day} className="flex flex-col">
                <div className="border-ink flex items-baseline gap-3 border-t-2 pt-4">
                  <span className="font-serif text-2xl font-medium">{step.day}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-ink-muted mt-2 text-base leading-relaxed">{step.body}</p>
                <div className="mt-6">
                  {step.shot === "slide" ? (
                    <SlideShot />
                  ) : step.shot === "report" ? (
                    <ReportShot />
                  ) : (
                    <EmailShot />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-ink text-paper">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <p className="text-clay-soft/80 text-sm font-semibold tracking-[0.12em] uppercase">
              Built to listen, not to judge
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-[2.25rem] leading-tight font-medium tracking-[-0.015em]">
              AI does the sorting. You keep the shepherding.
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <h3 className="border-paper/20 text-paper/70 border-b pb-3 text-base font-semibold">
                  What it does
                </h3>
                <ul className="mt-2">
                  {does.map((item) => (
                    <li key={item} className="border-paper/10 border-b py-4 text-lg leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="border-paper/20 text-paper/70 border-b pb-3 text-base font-semibold">
                  What it never does
                </h3>
                <ul className="mt-2">
                  {never.map((item) => (
                    <li
                      key={item}
                      className="border-paper/10 text-paper/85 border-b py-4 text-lg leading-snug"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-20 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="text-clay text-sm font-semibold tracking-[0.12em] uppercase">
              For your deacons and care team
            </p>
            <h2 className="mt-3 font-serif text-[2.25rem] leading-tight font-medium tracking-[-0.015em]">
              Sometimes what stuck is a cry for help.
            </h2>
            <p className="text-ink-muted mt-4 text-lg leading-relaxed">
              When a reply sounds like someone is hurting, they see crisis help right away, and your
              church&apos;s care line. On Monday it&apos;s the first thing in the report, so your
              team can name care from the front the next Sunday. It stays anonymous.
            </p>
          </div>
          <div className="border-care/15 bg-care-soft rounded-2xl border p-6">
            <p className="text-care text-base font-semibold">One reply may need your care</p>
            <p className="text-ink-muted mt-1 text-sm">
              Anonymous. They saw 988 and your care contact when they sent it.
            </p>
            <div className="bg-surface mt-4 rounded-xl px-4 py-3 font-serif text-lg leading-snug">
              &ldquo;Honestly I don&apos;t see the point of anything anymore.&rdquo;
            </div>
          </div>
        </section>

        <section className="border-line border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-[2rem] leading-tight font-medium">
                See it with a real-looking church.
              </h2>
              <p className="text-ink-muted mt-2 text-lg">
                Three Sundays of replies, real AI reports, nothing to sign up for.
              </p>
            </div>
            <Link href="/demo" className={buttonPrimary}>
              Open the demo church
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-line border-t">
        <div className="text-ink-subtle mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm">
          <Logo size={22} />
          <p>Built for the AI for Church Hackathon 2026.</p>
          <nav aria-label="Footer" className="flex gap-4">
            <Link href="/demo" className="hover:text-ink">
              Demo
            </Link>
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
