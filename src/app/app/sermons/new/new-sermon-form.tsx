"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api, fieldError } from "@/lib/client-api";

const MAX = 280;
const inputClass =
  "mt-2 h-14 w-full rounded-field border-[1.5px] border-line bg-surface px-4 text-lg focus:border-ink focus:outline-none";
const NEW_SERIES = "__new__";

function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.toLocaleDateString("en-CA");
}

export function NewSermonForm({ series }: { series: Array<{ id: string; title: string }> }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [preachedOn, setPreachedOn] = useState(nextSunday);
  const [scriptureRef, setScriptureRef] = useState("");
  const [intendedTakeaway, setIntendedTakeaway] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [newSeries, setNewSeries] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});

    let chosenSeries: string | null = seriesId || null;
    if (seriesId === NEW_SERIES) {
      const created = await api<{ series: { id: string } }>("/api/series", {
        body: { title: newSeries },
      });
      if (!created.ok) {
        setBusy(false);
        return setErrors({ series: fieldError(created, "title") ?? created.error });
      }
      chosenSeries = created.data.series.id;
    }

    const result = await api<{ sermon: { id: string } }>("/api/sermons", {
      body: { title, preachedOn, scriptureRef, intendedTakeaway, seriesId: chosenSeries },
    });
    if (result.ok) return router.push(`/app/sermons/${result.data.sermon.id}`);
    setBusy(false);
    setErrors({
      title: fieldError(result, "title"),
      preachedOn: fieldError(result, "preachedOn"),
      scriptureRef: fieldError(result, "scriptureRef"),
      intendedTakeaway: fieldError(result, "intendedTakeaway"),
      form: result.fields ? undefined : result.error,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-6">
      <div>
        <label
          htmlFor="takeaway"
          className="block font-serif text-[1.375rem] leading-snug font-medium"
        >
          What do you want people to leave with?
        </label>
        <p className="text-ink-muted mt-1 text-base">
          One sentence. On Monday you&apos;ll see how close the room got.
        </p>
        <textarea
          id="takeaway"
          rows={3}
          maxLength={MAX}
          value={intendedTakeaway}
          onChange={(e) => setIntendedTakeaway(e.target.value)}
          placeholder="God finishes what he starts in you, even when you feel stuck."
          className="rounded-field border-line bg-surface placeholder:text-ink-subtle focus:border-ink mt-3 w-full resize-none border-[1.5px] px-4 py-3 font-serif text-xl leading-snug focus:outline-none"
        />
        <p className="text-ink-subtle mt-1 text-right text-sm">
          {intendedTakeaway.length}/{MAX}
        </p>
        {errors.intendedTakeaway && <ErrorText>{errors.intendedTakeaway}</ErrorText>}
      </div>

      <div>
        <label htmlFor="title" className="text-ink-muted text-base font-medium">
          Sermon title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        {errors.title && <ErrorText>{errors.title}</ErrorText>}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="text-ink-muted text-base font-medium">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={preachedOn}
            onChange={(e) => setPreachedOn(e.target.value)}
            className={inputClass}
          />
          {errors.preachedOn && <ErrorText>{errors.preachedOn}</ErrorText>}
        </div>
        <div>
          <label htmlFor="ref" className="text-ink-muted text-base font-medium">
            Main passage <span className="text-ink-subtle font-normal">(optional)</span>
          </label>
          <input
            id="ref"
            value={scriptureRef}
            onChange={(e) => setScriptureRef(e.target.value)}
            placeholder="Philippians 1:3-11"
            className={inputClass}
          />
          {errors.scriptureRef && <ErrorText>{errors.scriptureRef}</ErrorText>}
        </div>
      </div>

      <div>
        <label htmlFor="series" className="text-ink-muted text-base font-medium">
          Series <span className="text-ink-subtle font-normal">(optional)</span>
        </label>
        <select
          id="series"
          value={seriesId}
          onChange={(e) => setSeriesId(e.target.value)}
          className={inputClass}
        >
          <option value="">Not part of a series</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
          <option value={NEW_SERIES}>New series</option>
        </select>
        {seriesId === NEW_SERIES && (
          <input
            aria-label="New series name"
            value={newSeries}
            onChange={(e) => setNewSeries(e.target.value)}
            placeholder="Series name"
            className={inputClass}
          />
        )}
        {errors.series && <ErrorText>{errors.series}</ErrorText>}
      </div>

      {errors.form && <ErrorText>{errors.form}</ErrorText>}
      <Button type="submit" full disabled={busy || !title.trim() || !intendedTakeaway.trim()}>
        {busy ? "Creating" : "Create the QR code"}
      </Button>
    </form>
  );
}
