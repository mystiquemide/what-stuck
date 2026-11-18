import type { Metadata } from "next";
import { Eyebrow, Heading, Page } from "@/components/ui";
import { VerifyButton } from "./verify-button";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/**
 * The emailed link lands here. Signing in takes one tap, because email
 * scanners open links automatically and would otherwise use up the link.
 */
export default function VerifyPage() {
  return (
    <Page>
      <Eyebrow>What Stuck</Eyebrow>
      <Heading className="mt-5">One tap to sign in.</Heading>
      <VerifyButton />
    </Page>
  );
}
