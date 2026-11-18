import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getViewer } from "@/auth/session";
import { Eyebrow, Heading, Page } from "@/components/ui";
import { WelcomeForm } from "./welcome-form";

export const metadata: Metadata = { title: "Set up your church" };

export default async function WelcomePage() {
  if (!(await getCurrentUser())) redirect("/login");
  if (await getViewer()) redirect("/app");
  return (
    <Page>
      <Eyebrow>What Stuck</Eyebrow>
      <Heading className="mt-5">Tell us about your church.</Heading>
      <p className="text-ink-muted mt-3 text-lg">
        Two quick things, then you&apos;re ready for Sunday.
      </p>
      <WelcomeForm />
    </Page>
  );
}
