"use client";

import { useState } from "react";
import { Button, Card, Chip } from "@/components/ui";
import { formatYouAsked } from "@/you-asked/format";

type Question = { question: string; smallGroupPrompt: string; count: number };

/** Pick up to three questions to answer next Sunday. Nothing is shared until you copy it. */
export function YouAsked({
  sermonTitle,
  questions,
}: {
  sermonTitle: string;
  questions: Question[];
}) {
  const [picked, setPicked] = useState<number[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const output = picked.length
    ? formatYouAsked({ sermonTitle, picks: picked.map((i) => questions[i]!) })
    : null;

  function toggle(index: number) {
    setPicked((current) =>
      current.includes(index)
        ? current.filter((i) => i !== index)
        : current.length < 3
          ? [...current, index]
          : current,
    );
  }

  async function copy(text: string, which: string) {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <p className="text-ink-muted mt-1 text-base">
        Pick up to three to answer next Sunday. Paste them into your bulletin, such as In The
        Bulletin, or hand them to small groups.
      </p>
      <ul className="mt-4 space-y-3">
        {questions.map((q, i) => (
          <li key={q.question}>
            <label className="rounded-card border-line bg-surface has-[:checked]:border-ink block cursor-pointer border p-5">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={picked.includes(i)}
                  onChange={() => toggle(i)}
                  className="no-print accent-ink mt-1 size-5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-serif text-lg leading-snug font-medium">{q.question}</p>
                  <p className="text-ink-muted mt-2 text-base">
                    <span className="text-ink font-medium">Small group:</span> {q.smallGroupPrompt}
                  </p>
                  <div className="mt-2">
                    <Chip tone="neutral">
                      {q.count === 1 ? "1 person asked" : `${q.count} people asked`}
                    </Chip>
                  </div>
                </div>
              </div>
            </label>
          </li>
        ))}
      </ul>
      {output && (
        <Card tone="clay" className="no-print mt-4">
          <p className="text-clay font-semibold">Ready to share</p>
          <pre className="text-ink mt-2 font-sans text-base whitespace-pre-wrap">
            {output.bulletin}
          </pre>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              className="min-h-12 flex-1 text-base"
              onClick={() => copy(output.bulletin, "bulletin")}
            >
              {copied === "bulletin" ? "Copied" : "Copy for the bulletin"}
            </Button>
            {output.smallGroup && (
              <Button
                variant="secondary"
                className="min-h-12 flex-1 text-base"
                onClick={() => copy(output.smallGroup!, "groups")}
              >
                {copied === "groups" ? "Copied" : "Copy small-group questions"}
              </Button>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
