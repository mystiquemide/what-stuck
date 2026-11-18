import Link from "next/link";
import type { ReactNode } from "react";
import { OliveBranch, Sparkle } from "./landing/ornaments";
import { Logo } from "./logo";
import { Verse } from "./verse";

/**
 * The calm, church-themed frame for "not found" and "something went wrong",
 * so a member who hits a dead end still feels welcome.
 */
export function StatusPage({
  eyebrow,
  heading,
  children,
  actions,
  verse,
  spanish,
}: {
  eyebrow: string;
  heading: string;
  children: ReactNode;
  actions: ReactNode;
  verse: { text: string; reference: string };
  /** One line for Spanish speakers who came from a reply link. */
  spanish?: string;
}) {
  return (
    <div className="bg-sage relative flex min-h-dvh flex-col overflow-hidden">
      <OliveBranch className="text-gold/50 pointer-events-none absolute -top-4 -right-6 w-40 rotate-12 sm:w-56" />
      <OliveBranch className="text-gold/40 pointer-events-none absolute -bottom-10 -left-8 hidden w-64 -rotate-[160deg] sm:block" />
      <Sparkle className="text-gold/60 pointer-events-none absolute top-1/3 right-10 hidden w-4 sm:block" />
      <Sparkle className="text-gold/50 pointer-events-none absolute bottom-1/4 left-1/4 hidden w-3 sm:block" />
      <header className="relative mx-auto w-full max-w-xl px-6 pt-8">
        <Link href="/" aria-label="What Stuck home">
          <Logo size={26} />
        </Link>
      </header>
      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12">
        <p className="text-gold-deep text-sm font-semibold tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
        <h1 className="text-ink mt-3 font-serif text-[2.5rem] leading-[1.08] font-medium tracking-[-0.01em] sm:text-5xl">
          {heading}
        </h1>
        <div className="text-ink-muted mt-5 space-y-3 text-lg">{children}</div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">{actions}</div>
        <Verse className="mt-12" {...verse} />
        {spanish && (
          <p lang="es" className="text-ink-muted mt-8 text-sm">
            {spanish}
          </p>
        )}
      </main>
    </div>
  );
}

export const pillPrimary =
  "inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-7 text-lg font-semibold text-paper hover:bg-ink/90";
export const pillSecondary =
  "inline-flex min-h-14 items-center justify-center rounded-full border-[1.5px] border-ink/25 bg-transparent px-7 text-lg font-semibold text-ink hover:border-ink";
