"use client";

import { useState } from "react";
import { Button, Card, Eyebrow } from "@/components/ui";

const BUTTON_TEXT = "What stuck with you on Sunday?";

/**
 * Everything a church needs to put the reply link in its digital bulletin
 * (In The Bulletin or any other), so people who missed the screen can still answer.
 */
export function BulletinKit({ replyUrl, sermonTitle }: { replyUrl: string; sermonTitle: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const announcement = `${BUTTON_TEXT} Tell us in one line what you're taking home from "${sermonTitle}". It's anonymous and takes ten seconds: ${replyUrl}`;

  async function copy(text: string, which: string) {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className="mt-8">
      <Eyebrow>For your digital bulletin</Eyebrow>
      <p className="mt-1 text-lg font-semibold">
        Missed the screen? Put the question in the bulletin.
      </p>
      <p className="text-ink-muted mt-1 text-base">
        Add a link button in In The Bulletin, or paste the announcement into any bulletin, email or
        group chat. Replies land in the same report.
      </p>
      <dl className="mt-4 space-y-3 text-base">
        <div>
          <dt className="text-ink-subtle text-sm">Button text</dt>
          <dd className="font-medium">{BUTTON_TEXT}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle text-sm">Button link</dt>
          <dd className="font-medium break-all">{replyUrl}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button className="min-h-12 flex-1 text-base" onClick={() => copy(replyUrl, "link")}>
          {copied === "link" ? "Copied" : "Copy the button link"}
        </Button>
        <Button
          variant="secondary"
          className="min-h-12 flex-1 text-base"
          onClick={() => copy(announcement, "announcement")}
        >
          {copied === "announcement" ? "Copied" : "Copy an announcement"}
        </Button>
      </div>
    </Card>
  );
}
