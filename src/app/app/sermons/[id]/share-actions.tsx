"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api } from "@/lib/client-api";

export function ShareActions({
  sermonId,
  replyUrl,
  status,
  canWrite,
}: {
  sermonId: string;
  replyUrl: string;
  status: "open" | "closed";
  canWrite: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function toggle() {
    setBusy(true);
    const result = await api(`/api/sermons/${sermonId}`, {
      method: "PATCH",
      body: { status: status === "open" ? "closed" : "open" },
    });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <a
        href={`/api/sermons/${sermonId}/slide`}
        download
        className="rounded-button bg-ink text-paper hover:bg-ink/90 inline-flex min-h-12 items-center justify-center px-5 font-semibold"
      >
        Download the slide
      </a>
      <Button
        variant="secondary"
        className="min-h-12 text-base"
        onClick={async () => {
          await navigator.clipboard.writeText(replyUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Link copied" : "Copy the link"}
      </Button>
      {canWrite && (
        <Button variant="quiet" onClick={toggle} disabled={busy}>
          {status === "open" ? "Stop taking replies" : "Start taking replies again"}
        </Button>
      )}
      <p className="text-ink-subtle text-sm" aria-live="polite">
        {status === "open" ? "Taking replies now." : "Replies are closed."}
      </p>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
