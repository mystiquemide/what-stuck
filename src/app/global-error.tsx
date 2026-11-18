"use client";

import "./globals.css";

/** Last resort when even the site layout fails. Kept plain so it always renders. */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-sage text-ink">
        <title>Something went wrong · What Stuck</title>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-12">
          <p className="text-gold-deep text-sm font-semibold tracking-[0.18em] uppercase">
            Something went wrong
          </p>
          <h1 className="mt-3 font-serif text-[2.5rem] leading-[1.08] font-medium">
            We hit a snag on our side.
          </h1>
          <p className="text-ink-muted mt-5 text-lg">
            It isn&apos;t anything you did. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="bg-ink text-paper mt-8 inline-flex min-h-14 items-center justify-center rounded-full px-7 text-lg font-semibold"
          >
            Try again
          </button>
          <blockquote className="mt-12 font-serif text-lg leading-snug">
            &ldquo;God is our refuge and strength, an ever-present help in times of trouble.&rdquo;
          </blockquote>
          <p className="text-ink-muted mt-1 text-sm">Psalm 46:1, Berean Standard Bible (BSB)</p>
        </main>
      </body>
    </html>
  );
}
