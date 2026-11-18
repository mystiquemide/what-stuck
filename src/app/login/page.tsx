import type { Metadata } from "next";
import Link from "next/link";
import { OliveBranch } from "@/components/landing/ornaments";
import { Eyebrow, Heading, Page } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Page className="relative">
      <Eyebrow>
        <Link href="/" className="hover:text-ink">
          What Stuck
        </Link>
      </Eyebrow>
      <Heading className="mt-5">Sign in</Heading>
      <OliveBranch className="text-gold/60 pointer-events-none absolute top-4 right-2 w-14" />
      <p className="text-ink-muted mt-3 text-lg">
        We&apos;ll email you a link. No password to remember.
      </p>
      <LoginForm />
      <p className="text-ink-muted mt-10 text-base">
        Just looking?{" "}
        <a href="/demo" className="text-clay font-medium underline underline-offset-4">
          Open the demo church
        </a>
      </p>
    </Page>
  );
}
