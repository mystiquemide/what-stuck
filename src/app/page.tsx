import Link from "next/link";
import { ButtonLink, Card, Quote } from "@/components/ui";

const steps = [
  {
    title: "Put one question on the screen",
    body: "Type the one thing you want people to leave with. At the end of the sermon, show the QR code: “What will stick with you?”",
  },
  {
    title: "People answer in ten seconds",
    body: "No app, no account, no name. Their own words, in any language. They can ask for those words back on Wednesday.",
  },
  {
    title: "Read it Monday morning",
    body: "See how close the room got to your point, what drifted, and the questions people are still carrying.",
  },
];

const promises = [
  "Anonymous by default. No names, no member data.",
  "Every theme links to the real replies. Nothing invented.",
  "It never grades the preacher.",
  "AI sorts. You decide what gets shared.",
  "Replies that sound like someone is hurting go to the top, with crisis help shown right away.",
  "Scripture comes from a licensed Bible, never from AI.",
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-2xl px-6 pt-14 pb-12">
        <p className="font-serif text-xl font-medium">What Stuck</p>
        <h1 className="mt-10 font-serif text-[2.75rem] leading-[1.05] font-medium tracking-[-0.015em] sm:text-6xl">
          What did your church actually take home from Sunday?
        </h1>
        <p className="text-ink-muted mt-6 text-xl">
          Pastors preach every week and almost never find out. What Stuck asks one question after
          the sermon and shows you, on Monday, what landed and what didn&apos;t.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/demo" className="sm:flex-1">
            Try the demo church
          </ButtonLink>
          <ButtonLink href="/login" variant="secondary" className="sm:flex-1">
            Start for your church
          </ButtonLink>
        </div>
        <p className="text-ink-subtle mt-3 text-sm">Free. No app to install. Works on any phone.</p>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-12">
        <Card className="p-6">
          <p className="text-ink-subtle text-sm font-medium">You said</p>
          <p className="mt-1 font-serif text-xl leading-snug">
            Contentment is learned by leaning on Christ in every season, not by getting what you
            want.
          </p>
          <div className="border-line my-5 border-t" />
          <p className="text-ink-subtle text-sm font-medium">Some of them heard</p>
          <Quote className="bg-paper mt-2">
            I can do all things through Christ. Going to crush my finals this week.
          </Quote>
          <p className="text-ink-muted mt-4 text-base">
            Now you know what to say next Sunday. That&apos;s the point.
          </p>
        </Card>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-12">
        <h2 className="font-serif text-3xl font-medium">How it works</h2>
        <ol className="mt-6 space-y-6">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="bg-clay-soft text-clay flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-ink-muted mt-1 text-base">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <h2 className="font-serif text-3xl font-medium">Built to listen, not to judge</h2>
          <ul className="mt-6 space-y-3">
            {promises.map((p) => (
              <li key={p} className="flex gap-3 text-lg">
                <span aria-hidden className="bg-clay-soft mt-2.5 size-1.5 shrink-0 rounded-full" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="font-serif text-3xl font-medium">For members, too</h2>
        <p className="text-ink-muted mt-3 text-lg">
          Ask for a Wednesday note and you get your own words back midweek, with the passage and one
          question from your pastor. A sermon that lasts past Sunday.
        </p>
        <ButtonLink href="/demo" full className="mt-8">
          See it with a demo church
        </ButtonLink>
      </section>

      <footer className="border-line border-t">
        <div className="text-ink-subtle mx-auto flex max-w-2xl flex-wrap justify-between gap-2 px-6 py-6 text-sm">
          <span>What Stuck. Built for the AI for Church Hackathon 2026.</span>
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}
