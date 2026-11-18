import type { Metadata } from "next";
import { Eyebrow, Heading, Page } from "@/components/ui";

export const metadata: Metadata = { title: "Email deleted", robots: { index: false } };

export default function UnsubscribedPage() {
  return (
    <Page>
      <Eyebrow>What Stuck</Eyebrow>
      <Heading className="mt-5">Your email is deleted.</Heading>
      <p className="text-ink-muted mt-4 text-lg">
        You won&apos;t hear from us again. Your reply stays anonymous with your church.
      </p>
    </Page>
  );
}
