import Link from "next/link";
import type { Viewer } from "@/auth/access";
import { SignOutButton } from "./sign-out-button";

/** Top of every pastor page: wordmark, church, and a clear note when it's the demo. */
export function AppHeader({ viewer, churchName }: { viewer: Viewer; churchName: string }) {
  return (
    <>
      {viewer.kind === "demo" && (
        <div className="no-print bg-ink text-paper px-6 py-3 text-center text-sm">
          You&apos;re looking at a demo church with made-up replies. It&apos;s read-only.{" "}
          <Link href="/login" className="font-semibold underline underline-offset-4">
            Start your own
          </Link>
        </div>
      )}
      <header className="no-print mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 pt-6">
        <Link href="/app" className="min-w-0">
          <span className="block font-serif text-xl leading-none font-medium">What Stuck</span>
          <span className="text-ink-subtle mt-1 block truncate text-sm">{churchName}</span>
        </Link>
        {viewer.kind === "staff" ? <SignOutButton /> : <SignOutButton label="Leave demo" />}
      </header>
    </>
  );
}
