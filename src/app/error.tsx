"use client";

import Link from "next/link";
import { useEffect } from "react";
import { pillPrimary, pillSecondary, StatusPage } from "@/components/status-page";

/** Shown when something breaks on our side. Nothing the member wrote is lost by trying again. */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[page] unexpected error", error.digest ?? error.message);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Something went wrong"
      heading="We hit a snag on our side."
      verse={{
        text: "God is our refuge and strength, an ever-present help in times of trouble.",
        reference: "Psalm 46:1",
      }}
      spanish="Algo salió mal de nuestro lado. Inténtalo de nuevo en un momento."
      actions={
        <>
          <button type="button" onClick={() => retry()} className={pillPrimary}>
            Try again
          </button>
          <Link href="/" className={pillSecondary}>
            Go to the home page
          </Link>
        </>
      }
    >
      <p>It isn&apos;t anything you did. Please try again in a moment.</p>
      {error.digest && <p className="text-ink-subtle text-sm">Reference: {error.digest}</p>}
    </StatusPage>
  );
}
