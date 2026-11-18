"use client";

import { useState, type FormEvent } from "react";
import { Button, Chip, ErrorText } from "@/components/ui";
import { api, fieldError } from "@/lib/client-api";

type Member = { userId: string; email: string; role: "owner" | "editor"; joinedAt: string };

export function TeamManager({
  isOwner,
  currentUserId,
  initialTeam,
}: {
  isOwner: boolean;
  currentUserId: string;
  initialTeam: Member[];
}) {
  const [team, setTeam] = useState(initialTeam);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [added, setAdded] = useState<string>();

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    setAdded(undefined);
    const result = await api<{ member: Member }>("/api/team", { body: { email } });
    setBusy(false);
    if (!result.ok) return setError(fieldError(result, "email") ?? result.error);
    setTeam((t) => [...t, { ...result.data.member, joinedAt: new Date().toISOString() }]);
    setAdded(result.data.member.email);
    setEmail("");
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remove ${member.email} from your team?`)) return;
    const result = await api(`/api/team/${member.userId}`, { method: "DELETE" });
    if (!result.ok) return setError(result.error);
    setTeam((t) => t.filter((m) => m.userId !== member.userId));
  }

  return (
    <>
      <ul className="divide-line rounded-card border-line bg-surface mt-8 divide-y border">
        {team.map((m) => (
          <li key={m.userId} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-medium">{m.email}</p>
              <div className="mt-1">
                <Chip tone={m.role === "owner" ? "clay" : "neutral"}>
                  {m.role === "owner" ? "Pastor" : "Team member"}
                </Chip>
                {m.userId === currentUserId && (
                  <span className="text-ink-subtle ml-2 text-sm">That&apos;s you</span>
                )}
              </div>
            </div>
            {isOwner && m.role !== "owner" && (
              <button
                type="button"
                onClick={() => remove(m)}
                className="text-ink-subtle hover:text-care min-h-11 px-2 text-base font-medium"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <form onSubmit={add} noValidate className="mt-8">
          <label htmlFor="member-email" className="text-ink-muted text-base font-medium">
            Add someone by email
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="member-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deacon@example.com"
              className="rounded-field border-line bg-surface focus:border-ink h-14 w-full border-[1.5px] px-4 text-lg focus:outline-none sm:flex-1"
            />
            <Button type="submit" disabled={busy || !email.trim()} className="sm:w-48">
              {busy ? "Adding" : "Add to team"}
            </Button>
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          {added && (
            <p role="status" className="text-olive mt-3 text-base">
              {added} is on your team. They can sign in with that email now.
            </p>
          )}
        </form>
      ) : (
        <p className="text-ink-muted mt-6 text-base">
          Only the pastor who set up this church can add or remove people.
        </p>
      )}
    </>
  );
}
