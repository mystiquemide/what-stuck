import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "quiet" | "care";

const buttonBase =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-button px-6 text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const buttonVariants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/90",
  secondary: "border-[1.5px] border-line bg-surface text-ink hover:border-ink-subtle",
  quiet:
    "min-h-11 px-3 text-base font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline",
  care: "bg-care text-white hover:bg-care/90",
};

export function Button({
  variant = "primary",
  full,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; full?: boolean }) {
  return (
    <button
      className={cx(buttonBase, buttonVariants[variant], full && "w-full", className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  full,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; full?: boolean }) {
  return (
    <Link
      className={cx(buttonBase, buttonVariants[variant], full && "w-full", className)}
      {...props}
    />
  );
}

const cardTones = {
  default: "border-line bg-surface",
  clay: "border-clay/25 bg-clay-soft",
  care: "border-care/20 bg-care-soft",
  amber: "border-amber/20 bg-amber-soft",
} as const;

export function Card({
  className,
  tone = "default",
  ...props
}: ComponentProps<"div"> & { tone?: keyof typeof cardTones }) {
  return <div className={cx("rounded-card border p-5", cardTones[tone], className)} {...props} />;
}

type Tone = "clay" | "olive" | "amber" | "care" | "neutral";
const tones: Record<Tone, string> = {
  clay: "bg-clay-soft text-clay",
  olive: "bg-olive-soft text-olive",
  amber: "bg-amber-soft text-amber",
  care: "bg-care-soft text-care",
  neutral: "bg-line/60 text-ink-muted",
};

export function Chip({ tone = "clay", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** A member's exact words. Never paraphrased. */
export function Quote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <blockquote
      className={cx(
        "border-line bg-surface text-ink rounded-xl border px-4 py-3 font-serif text-lg leading-snug",
        className,
      )}
    >
      &ldquo;{children}&rdquo;
    </blockquote>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-ink-subtle text-sm font-medium", className)}>{children}</p>;
}

export function Heading({
  children,
  className,
  as: Tag = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const size =
    Tag === "h1"
      ? "text-[2.375rem] leading-[1.1]"
      : Tag === "h2"
        ? "text-[1.625rem] leading-tight"
        : "text-xl leading-snug";
  return (
    <Tag className={cx("text-ink font-serif font-medium tracking-[-0.01em]", size, className)}>
      {children}
    </Tag>
  );
}

/** Phone-first column. On a laptop it stays a readable column in the middle. */
export function Page({
  children,
  className,
  wide,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <main
      className={cx(
        "mx-auto flex w-full flex-1 flex-col px-6 pt-10 pb-8",
        wide ? "max-w-2xl" : "max-w-md",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("bg-line/70 animate-pulse rounded-xl", className)} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <Page>
      <span className="sr-only" role="status">
        Loading
      </span>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-10 w-4/5" />
      <Skeleton className="mt-3 h-5 w-3/5" />
      <Skeleton className="mt-8 h-40 w-full" />
    </Page>
  );
}

export function ErrorText({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} role="alert" className="text-care mt-2 text-base font-medium">
      {children}
    </p>
  );
}

export { cx };
