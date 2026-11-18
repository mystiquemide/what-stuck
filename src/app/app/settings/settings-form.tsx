"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api, fieldError } from "@/lib/client-api";

type Settings = {
  name: string;
  careContact: string | null;
  careFormUrl: string | null;
  connectFormUrl: string | null;
};

const inputClass =
  "mt-2 h-14 w-full rounded-field border-[1.5px] border-line bg-surface px-4 text-lg focus:border-ink focus:outline-none disabled:bg-paper disabled:text-ink-muted";

const FIELDS: Array<{
  key: keyof Settings;
  label: string;
  hint: string;
  placeholder: string;
  type?: "url";
}> = [
  {
    key: "name",
    label: "Church name",
    hint: "Shown at the top of the reply page.",
    placeholder: "Hope Street Church",
  },
  {
    key: "careContact",
    label: "Pastoral care contact",
    hint: "Shown, with crisis lines, to anyone whose reply sounds like they need help.",
    placeholder: "Care line: (555) 014-2200",
  },
  {
    key: "careFormUrl",
    label: "Prayer or care form link",
    hint: "Offered to a member who sounds like they're hurting, so they can ask someone to reach out. Their reply here stays anonymous. They choose what to share on your form.",
    placeholder: "https://your-church.ministryforms.com/prayer",
    type: "url",
  },
  {
    key: "connectFormUrl",
    label: "Connect card or next-steps link",
    hint: "Offered on the thank-you screen for anyone who wants to get connected.",
    placeholder: "https://your-church.inthebulletin.com",
    type: "url",
  },
];

export function SettingsForm({ initial, canEdit }: { initial: Settings; canEdit: boolean }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, initial[f.key] ?? ""])),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    const result = await api("/api/churches/settings", { method: "PATCH", body: values });
    setBusy(false);
    if (result.ok) {
      setErrors({});
      setSaved(true);
      return;
    }
    setErrors({
      ...Object.fromEntries(FIELDS.map((f) => [f.key, fieldError(result, f.key)])),
      form: result.fields ? undefined : result.error,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-7">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label htmlFor={field.key} className="text-ink-muted text-base font-medium">
            {field.label}
            {field.key !== "name" && (
              <span className="text-ink-subtle font-normal"> (optional)</span>
            )}
          </label>
          <input
            id={field.key}
            type={field.type ?? "text"}
            inputMode={field.type === "url" ? "url" : undefined}
            value={values[field.key]}
            onChange={(e) => {
              setSaved(false);
              setValues((v) => ({ ...v, [field.key]: e.target.value }));
            }}
            placeholder={field.placeholder}
            disabled={!canEdit}
            aria-invalid={Boolean(errors[field.key])}
            aria-describedby={`${field.key}-hint`}
            className={inputClass}
          />
          <p id={`${field.key}-hint`} className="text-ink-subtle mt-1 text-sm">
            {field.hint}
          </p>
          {errors[field.key] && <ErrorText>{errors[field.key]}</ErrorText>}
        </div>
      ))}
      {errors.form && <ErrorText>{errors.form}</ErrorText>}
      {canEdit && (
        <div>
          <Button type="submit" full disabled={busy}>
            {busy ? "Saving" : "Save settings"}
          </Button>
          <p role="status" className="text-olive mt-3 text-center text-base font-medium">
            {saved ? "Saved. Members see this on their next reply." : ""}
          </p>
        </div>
      )}
    </form>
  );
}
