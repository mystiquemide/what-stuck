import Link from "next/link";
import type { Viewer } from "@/auth/access";
import { Logo } from "./logo";
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
          <Logo size={26} />
          <span className="text-ink-subtle mt-1 block truncate text-sm">{churchName}</span>
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-1">
          <Link
            href="/app/team"
            className="text-ink-muted hover:text-ink flex min-h-11 items-center rounded-lg px-3 text-base font-medium"
          >
            Team
          </Link>
          <SignOutButton label={viewer.kind === "staff" ? "Sign out" : "Leave demo"} />
        </nav>
      </header>
    </>
  );
}
