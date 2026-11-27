import Image from "next/image";
import { BSB_NOTICE } from "@/scripture/notice";
import Link from "next/link";
import { EmailShot, PhoneReply, ReportShot, SlideShot } from "@/components/landing/product-shots";
import { Logo } from "@/components/logo";
import { OliveBranch, Sparkle } from "@/components/landing/ornaments";
import { Verse, VERSES } from "@/components/verse";

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

const pillPrimary =
  "inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-8 text-lg font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-ink/90 hover:shadow-[0_10px_24px_-12px_rgba(28,25,23,0.6)] motion-reduce:hover:translate-y-0";
const pillOutline =
  "inline-flex min-h-14 items-center justify-center rounded-full border-[1.5px] border-ink px-8 text-lg font-semibold text-ink transition hover:bg-ink hover:text-paper";

export default function Home() {
  return (
    <div className="flex-1">
      <div className="bg-sage relative overflow-hidden">
        <OliveBranch className="text-gold/70 pointer-events-none absolute -top-6 right-[-30px] hidden w-56 lg:block" />
        <OliveBranch
          flip
          className="text-gold/50 pointer-events-none absolute bottom-[-40px] left-[38%] hidden w-40 rotate-[160deg] lg:block"
        />
        <Sparkle className="text-gold/70 absolute top-24 right-[30%] hidden lg:block" />
        <Sparkle size={8} className="text-gold/60 absolute top-40 right-[24%] hidden lg:block" />
        <Sparkle size={10} className="text-gold/60 absolute bottom-24 left-[46%] hidden lg:block" />

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-6">
          <Link href="/" aria-label="What Stuck home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex items-center text-base font-medium">
            <Link
              href="/demo"
              className="text-ink-muted hover:text-ink hidden min-h-11 items-center px-3 sm:flex"
            >
              See the demo
            </Link>
            <span aria-hidden className="bg-ink/25 hidden h-4 w-px sm:block" />
            <Link
              href="/login"
              className="text-ink-muted hover:text-ink flex min-h-11 items-center px-3"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <main className="relative">
          <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-14 pb-24 lg:grid-cols-[1fr_1fr] lg:pt-16">
            <div>
              <h1 className="text-ink font-serif text-[3.5rem] leading-[0.95] font-semibold tracking-[-0.01em] uppercase sm:text-[5.25rem]">
                <span className="block">Hear</span> <span className="block">what stuck</span>
              </h1>
              <p className="text-ink mt-6 text-[0.95rem] font-semibold tracking-[0.18em] uppercase sm:text-base">
                What your church took home from Sunday
              </p>
              <p className="text-ink-muted mt-6 max-w-lg text-lg leading-relaxed">
                Pastors preach every week and hear &ldquo;good sermon&rdquo; at the door. What Stuck
                asks the room one question after the sermon, and on Monday shows you what landed,
                what drifted, and who might need you.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/demo" className={pillPrimary}>
                  Open the demo church
                </Link>
                <Link href="/login" className={pillOutline}>
                  Start for your church
                </Link>
              </div>
              <p className="text-ink-muted mt-4 text-sm">
                Free. Nothing to install. Works on any phone.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] pb-24 sm:pb-10">
              <OliveBranch className="text-gold/70 pointer-events-none absolute -top-10 -left-14 hidden w-36 sm:block" />
              <figure className="relative ml-auto w-[78%] sm:w-[72%]">
                <div className="ring-gold/25 overflow-hidden rounded-[36px] ring-1">
                  <Image
                    src="/images/hero-pew.webp"
                    alt="A woman sits in a church pew after the service, typing what stuck with her on her phone, while others talk in the aisle."
                    width={896}
                    height={1120}
                    priority
                    sizes="(min-width: 1024px) 400px, 72vw"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="bg-paper/90 text-ink-muted absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px]">
                  Illustrative photo, made with AI
                </figcaption>
              </figure>
              <div className="absolute bottom-0 left-0 w-[260px] origin-bottom-left scale-[0.62] sm:scale-[0.82]">
                <PhoneReply />
              </div>
              <Sparkle className="text-gold/70 absolute top-6 left-[18%] hidden sm:block" />
            </div>
          </section>
        </main>
      </div>

      <main>
        <section aria-label="Scripture" className="border-line bg-surface border-y">
          <figure className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
            <blockquote className="font-serif text-[1.75rem] leading-snug font-medium tracking-[-0.01em] italic sm:text-[2.25rem]">
              &ldquo;Consequently, faith comes by hearing, and hearing by the word of Christ.&rdquo;
            </blockquote>
            <figcaption className="text-ink-subtle mt-5 text-base">
              Romans 10:17, Berean Standard Bible (BSB)
            </figcaption>
            <p className="text-ink-muted mx-auto mt-8 max-w-xl text-lg">
              Preaching is half of a conversation. What Stuck gives you the other half: what people
              actually heard.
            </p>
          </figure>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-clay text-sm font-semibold tracking-[0.12em] uppercase">
                How a week works
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-[2.25rem] leading-tight font-medium tracking-[-0.015em]">
                Three moments. About two minutes of your time.
              </h2>
              <p className="text-ink-muted mt-4 max-w-lg text-lg leading-relaxed">
                You keep preaching the way you do. What Stuck just listens at the door, so the week
                after Sunday has something to work with.
              </p>
            </div>
            <figure className="relative">
              <div className="ring-gold/25 overflow-hidden rounded-[28px] ring-1">
                <Image
                  src="/images/bible-pew.webp"
                  alt="An open Bible on a church pew beside handwritten sermon notes and a pencil, in morning light."
                  width={1168}
                  height={880}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="bg-paper/90 text-ink-muted absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px]">
                Illustrative photo, made with AI
              </figcaption>
              <OliveBranch className="text-gold/70 pointer-events-none absolute -bottom-8 -left-8 hidden w-28 sm:block" />
            </figure>
          </div>
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

        <section className="bg-sage">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-2">
            <figure className="relative order-2 lg:order-1">
              <div className="ring-gold/25 overflow-hidden rounded-[28px] ring-1">
                <Image
                  src="/images/bible-morning.webp"
                  alt="An open Bible on a kitchen table with a cup of coffee, a sprig of olive leaves and a phone, in morning light."
                  width={1168}
                  height={880}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="bg-paper/90 text-ink-muted absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px]">
                Illustrative photo, made with AI
              </figcaption>
              <Sparkle className="text-gold/70 absolute -top-4 -right-2" />
            </figure>
            <div className="order-1 lg:order-2">
              <h2 className="font-serif text-[2.25rem] leading-tight font-medium tracking-[-0.015em]">
                Let the conversation keep going after Sunday.
              </h2>
              <p className="text-ink-muted mt-4 text-lg leading-relaxed">
                See it with a real-looking church: three Sundays of replies and real AI reports.
                Nothing to sign up for.
              </p>
              <div className="mt-8">
                <Link href="/demo" className={pillPrimary}>
                  Open the demo church
                </Link>
              </div>
              <Verse className="mt-12 max-w-lg" {...VERSES.dwell} />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sage border-gold/20 border-t">
        <div className="text-ink-subtle mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-sm">
          <Logo size={22} />
          <nav aria-label="Footer" className="flex gap-4">
            <Link href="/demo" className="hover:text-ink">
              Demo
            </Link>
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
          </nav>
        </div>
        <div className="text-ink-subtle mx-auto w-full max-w-6xl space-y-2 px-6 pb-8 text-sm">
          <p>
            Scripture comes from the{" "}
            <a
              href="https://faith.tools/app/bible-sdk"
              className="hover:text-ink underline underline-offset-4"
            >
              faith.tools Bible SDK
            </a>
            . Works with the tools churches already use, like In The Bulletin, MinistryForms and
            Genesis ChMS.
          </p>
          <p>{BSB_NOTICE}</p>
        </div>
      </footer>
    </div>
  );
}
