"use client";

import { useState } from "react";
import { Chip } from "@/components/ui";
import { api } from "@/lib/client-api";

type Reply = {
  id: string;
  takeaway: string;
  question: string | null;
  careFlag: boolean;
  hidden: boolean;
  createdAt: string;
};

export function ReplyList({ replies, canWrite }: { replies: Reply[]; canWrite: boolean }) {
  const [rows, setRows] = useState(replies);

  async function setHidden(id: string, hidden: boolean) {
    setRows((current) => current.map((r) => (r.id === id ? { ...r, hidden } : r)));
    const result = await api(`/api/responses/${id}`, { method: "PATCH", body: { hidden } });
    if (!result.ok)
      setRows((current) => current.map((r) => (r.id === id ? { ...r, hidden: !hidden } : r)));
  }

  if (rows.length === 0) {
    return <p className="text-ink-muted mt-4 text-base">No replies yet.</p>;
  }

  return (
    <ul className="divide-line rounded-card border-line bg-surface mt-4 divide-y border">
      {rows.map((r) => (
        <li key={r.id} className={r.hidden ? "px-5 py-4 opacity-50" : "px-5 py-4"}>
          <p className="font-serif text-lg leading-snug">{r.takeaway}</p>
          {r.question && <p className="text-ink-muted mt-1 text-base">Asked: {r.question}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {r.careFlag && <Chip tone="care">May need care</Chip>}
            {r.hidden && <Chip tone="neutral">Hidden from the report</Chip>}
            {canWrite && (
              <button
                type="button"
                onClick={() => setHidden(r.id, !r.hidden)}
                className="no-print text-ink-subtle hover:text-ink ml-auto min-h-11 px-2 text-sm font-medium"
              >
                {r.hidden ? "Show" : "Hide"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
