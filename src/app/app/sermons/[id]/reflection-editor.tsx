"use client";

import { useState } from "react";
import { Button, Card, Chip, ErrorText, Eyebrow } from "@/components/ui";
import { escapeHtml } from "@/emails/html";
import { api } from "@/lib/client-api";

/**
 * The Wednesday question. AI can suggest one, but nothing goes to members
 * until the pastor approves the exact wording.
 */
export function ReflectionEditor({
  sermonId,
  initialQuestion,
  initiallyApproved,
  canWrite,
  notePreview,
  questionMarker,
}: {
  sermonId: string;
  initialQuestion: string | null;
  initiallyApproved: boolean;
  canWrite: boolean;
  /** The real Wednesday email HTML, with `questionMarker` where the question goes. */
  notePreview: string;
  questionMarker: string;
}) {
  const [question, setQuestion] = useState(initialQuestion ?? "");
  const [approvedText, setApprovedText] = useState(initiallyApproved ? initialQuestion : null);
  const [busy, setBusy] = useState<"draft" | "approve" | null>(null);
  const [error, setError] = useState<string>();
  const [showPreview, setShowPreview] = useState(false);
  const approved = approvedText !== null && approvedText === question;

  async function draft() {
    setBusy("draft");
    setError(undefined);
    const result = await api<{ question: string }>(`/api/sermons/${sermonId}/reflection`, {
      method: "POST",
    });
    setBusy(null);
    if (!result.ok) return setError(result.error);
    setQuestion(result.data.question);
  }

  async function approve() {
    setBusy("approve");
    setError(undefined);
    const result = await api(`/api/sermons/${sermonId}/reflection`, {
      method: "PUT",
      body: { question },
    });
    setBusy(null);
    if (!result.ok) return setError(result.fields?.[0]?.message ?? result.error);
    setApprovedText(question);
  }

  return (
    <Card className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>Wednesday question</Eyebrow>
        {approved ? <Chip tone="olive">Approved</Chip> : <Chip tone="amber">Needs your OK</Chip>}
      </div>
      <p className="text-ink-muted mt-2 text-base">
        People who ask for a Wednesday note get their own words back, the passage, and this
        question. Notes only go out after you approve it.
      </p>
      <label htmlFor="reflection" className="sr-only">
        Wednesday question
      </label>
      <textarea
        id="reflection"
        rows={3}
        maxLength={200}
        value={question}
        readOnly={!canWrite}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Where do you feel unfinished right now, and what would trusting God with it look like?"
        className="rounded-field border-line bg-paper placeholder:text-ink-subtle focus:border-ink mt-3 w-full resize-none border-[1.5px] px-4 py-3 font-serif text-lg leading-snug focus:outline-none"
      />
      {error && <ErrorText>{error}</ErrorText>}
      {canWrite && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            className="min-h-12 flex-1 text-base"
            onClick={approve}
            disabled={busy !== null || question.trim().length < 10 || approved}
          >
            {busy === "approve" ? "Saving" : approved ? "Approved" : "Approve this question"}
          </Button>
          <Button
            variant="secondary"
            className="min-h-12 flex-1 text-base"
            onClick={draft}
            disabled={busy !== null}
          >
            {busy === "draft" ? "Thinking" : "Suggest one with AI"}
          </Button>
        </div>
      )}
      <details className="no-print mt-4" onToggle={(e) => setShowPreview(e.currentTarget.open)}>
        <summary className="text-clay min-h-11 cursor-pointer py-2 text-base font-medium">
          Preview the Wednesday email
        </summary>
        <p className="text-ink-muted mt-1 text-sm">
          This is the email a member gets, with a recent reply standing in for their words.
        </p>
        {showPreview && (
          <iframe
            title="Preview of the Wednesday email"
            sandbox=""
            srcDoc={notePreview.replace(
              questionMarker,
              escapeHtml(question.trim() || "Your approved question appears here."),
            )}
            className="rounded-card border-line mt-3 h-[34rem] w-full border bg-white"
          />
        )}
      </details>
    </Card>
  );
}
