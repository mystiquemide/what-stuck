import Link from "next/link";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="no-print text-ink-muted hover:text-ink inline-flex min-h-11 items-center gap-1 text-base font-medium"
    >
      <span aria-hidden>←</span> {children}
    </Link>
  );
}
