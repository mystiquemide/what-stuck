"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api, fieldError } from "@/lib/client-api";

const inputClass =
  "mt-2 h-14 w-full rounded-field border-[1.5px] border-line bg-surface px-4 text-lg focus:border-ink focus:outline-none";

export function WelcomeForm() {
  const router = useRouter();
  const zones = useMemo(() => Intl.supportedValuesOf("timeZone"), []);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [careContact, setCareContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await api("/api/churches", { body: { name, timezone, careContact } });
    if (result.ok) return router.replace("/app");
    setBusy(false);
    setErrors({
      name: fieldError(result, "name"),
      timezone: fieldError(result, "timezone"),
      form: result.fields ? undefined : result.error,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-6">
      <div>
        <label htmlFor="name" className="text-ink-muted text-base font-medium">
          Church name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          autoComplete="organization"
        />
        {errors.name && <ErrorText>{errors.name}</ErrorText>}
      </div>
      <div>
        <label htmlFor="tz" className="text-ink-muted text-base font-medium">
          Time zone
        </label>
        <select
          id="tz"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className={inputClass}
        >
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <p className="text-ink-subtle mt-1 text-sm">So Wednesday notes arrive at 9 AM your time.</p>
      </div>
      <div>
        <label htmlFor="care" className="text-ink-muted text-base font-medium">
          Pastoral care contact <span className="text-ink-subtle font-normal">(optional)</span>
        </label>
        <input
          id="care"
          value={careContact}
          onChange={(e) => setCareContact(e.target.value)}
          placeholder="Care line: (555) 014-2200"
          className={inputClass}
        />
        <p className="text-ink-subtle mt-1 text-sm">
          Shown, with crisis lines, to anyone whose reply sounds like they need help.
        </p>
      </div>
      {errors.form && <ErrorText>{errors.form}</ErrorText>}
      <Button type="submit" full disabled={busy || !name.trim()}>
        {busy ? "Setting up" : "Continue"}
      </Button>
    </form>
  );
}
