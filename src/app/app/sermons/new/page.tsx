import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePastorPage } from "@/auth/page";
import { BackLink } from "@/components/back-link";
import { Heading, Page } from "@/components/ui";
import { getDb } from "@/db";
import { listSeries } from "@/sermons/service";
import { NewSermonForm } from "./new-sermon-form";

export const metadata: Metadata = { title: "Set up a sermon" };

export default async function NewSermonPage() {
  const viewer = await requirePastorPage();
  if (!viewer.canWrite) redirect("/app");
  const series = await listSeries(getDb(), viewer);
  return (
    <Page>
      <BackLink href="/app">Your sermons</BackLink>
      <Heading className="mt-4">Set up Sunday&apos;s sermon</Heading>
      <NewSermonForm series={series.map((s) => ({ id: s.id, title: s.title }))} />
    </Page>
  );
}
