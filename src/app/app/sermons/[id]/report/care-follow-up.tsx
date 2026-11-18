"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api } from "@/lib/client-api";

type Props = {
  replyId: string;
  canWrite: boolean;
  handledAt: string | null;
  handledBy: string | null;
  note: string | null;
};

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/** Lets the church team record that someone followed up, so a care reply never falls through the cracks. */
export function CareFollowUp({ replyId, canWrite, handledAt, handledBy, note }: Props) {
  const router = useRouter();
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function save(handled: boolean) {
    setBusy(true);
    const result = await api(`/api/responses/${replyId}/care`, {
      method: "PATCH",
      body: { handled, note: handled ? text : undefined },
    });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setOpen(false);
    setText("");
    router.refresh();
  }

  if (handledAt) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-olive text-base font-medium">
          <span aria-hidden>✓ </span>Followed up{handledBy ? ` by ${handledBy}` : ""} on{" "}
          {when(handledAt)}
          {note ? `: ${note}` : ""}
        </p>
        {canWrite && (
          <Button
            variant="quiet"
            className="no-print px-0"
            onClick={() => save(false)}
            disabled={busy}
          >
            Undo
          </Button>
        )}
        {error && <ErrorText>{error}</ErrorText>}
      </div>
    );
  }

  if (!canWrite) {
    return (
      <p className="text-ink-muted mt-2 text-sm">
        In your own church, the care team marks this once someone has followed up.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="quiet" className="no-print mt-1 px-0" onClick={() => setOpen(true)}>
        Mark as followed up
      </Button>
    );
  }

  return (
    <div className="no-print mt-2">
      <label htmlFor={noteId} className="text-ink-muted text-sm font-medium">
        What happened? <span className="font-normal">(optional, only your team sees this)</span>
      </label>
      <input
        id={noteId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={200}
        placeholder="Named care from the front. Prayer team praying."
        className="rounded-field border-line bg-surface focus:border-ink mt-1 h-12 w-full border-[1.5px] px-3 text-base focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <Button className="min-h-11 px-4 text-base" onClick={() => save(true)} disabled={busy}>
          {busy ? "Saving" : "Save"}
        </Button>
        <Button variant="quiet" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
