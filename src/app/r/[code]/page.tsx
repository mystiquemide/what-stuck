import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { PUBLIC_CODE_PATTERN } from "@/lib/codes";
import { getPublicSermon } from "@/sermons/service";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = {
  title: "What will stick with you?",
  robots: { index: false, follow: false },
};

export default async function ReplyPage({ params }: PageProps<"/r/[code]">) {
  const { code } = await params;
  if (!PUBLIC_CODE_PATTERN.test(code)) notFound();
  const sermon = await getPublicSermon(getDb(), code);
  if (!sermon) notFound();

  return (
    <ReplyForm
      code={code}
      churchName={sermon.churchName}
      sermonTitle={sermon.title}
      open={sermon.status === "open"}
      careContact={sermon.churchCareContact}
      careFormUrl={sermon.churchCareFormUrl}
      connectFormUrl={sermon.churchConnectFormUrl}
    />
  );
}
