import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { ButtonLink, Card, Eyebrow, Heading, Page } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your church's own form",
  robots: { index: false, follow: false },
};

const COPY = {
  care: {
    eyebrow: "Prayer and care form",
    heading: "This is where your church's care form opens.",
    body: "In a real church, this button opens the prayer or care form the church already uses, for example one built with MinistryForms or Genesis ChMS. The member chooses what to share and how to be reached, and the care team follows up there.",
  },
  connect: {
    eyebrow: "Connect card",
    heading: "This is where your church's connect card opens.",
    body: "In a real church, this opens the connect card or next-steps page the church already uses, such as an In The Bulletin connect card, a MinistryForms form or a Genesis ChMS form. New guests land in the church's own follow-up.",
  },
} as const;

export function generateStaticParams() {
  return [{ kind: "care" }, { kind: "connect" }];
}

/** Stand-in for the demo church's forms, so judges can see where the links go. */
export default async function SampleFormPage({ params }: PageProps<"/sample-form/[kind]">) {
  const { kind } = await params;
  if (kind !== "care" && kind !== "connect") notFound();
  const copy = COPY[kind];
  return (
    <Page>
      <Logo size={26} />
      <Eyebrow className="mt-10">{copy.eyebrow}</Eyebrow>
      <Heading className="mt-2">{copy.heading}</Heading>
      <p className="text-ink-muted mt-4 text-lg">{copy.body}</p>
      <Card className="mt-6">
        <p className="text-base">
          What Stuck never sees what people write on the church&apos;s form. Replies to the sermon
          stay anonymous either way.
        </p>
      </Card>
      <div className="flex-1" />
      <ButtonLink href="/" variant="secondary" full className="mt-8">
        Back to What Stuck
      </ButtonLink>
    </Page>
  );
}
