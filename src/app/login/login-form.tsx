"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api } from "@/lib/client-api";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    setError(undefined);
    const result = await api("/api/auth/login", { body: { email } });
    if (result.ok) return setState("sent");
    setState("idle");
    setError(result.fields?.[0]?.message ?? result.error);
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-card border-line bg-surface mt-8 border p-5">
        <p className="text-lg font-semibold">Check your email.</p>
        <p className="text-ink-muted mt-1 text-base">
          We sent a sign-in link to {email}. It works once and expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8">
      <label htmlFor="email" className="text-ink-muted text-base font-medium">
        Your email
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-field border-line bg-surface focus:border-ink mt-2 h-14 w-full border-[1.5px] px-4 text-lg focus:outline-none"
      />
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" full className="mt-5" disabled={state === "sending" || !email}>
        {state === "sending" ? "Sending" : "Email me a link"}
      </Button>
    </form>
  );
}
