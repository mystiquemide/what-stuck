"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Button, ErrorText, Eyebrow, Heading, Page, Quote } from "@/components/ui";
import { OliveBranch } from "@/components/landing/ornaments";
import { Verse, VERSES } from "@/components/verse";
import { api, fieldError } from "@/lib/client-api";

type Props = {
  code: string;
  churchName: string;
  sermonTitle: string;
  open: boolean;
  careContact: string | null;
  careFormUrl: string | null;
  connectFormUrl: string | null;
};

type Sent = { takeaway: string; care: boolean; noteScheduled: boolean };

const MAX = 500;

export function ReplyForm({
  code,
  churchName,
  sermonTitle,
  open,
  careContact,
  careFormUrl,
  connectFormUrl,
}: Props) {
  const [takeaway, setTakeaway] = useState("");
  const [question, setQuestion] = useState("");
  const [wantsNote, setWantsNote] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<{
    form?: string;
    takeaway?: string;
    question?: string;
    email?: string;
  }>({});
  const [sent, setSent] = useState<Sent | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const ids = { takeaway: useId(), question: useId(), email: useId(), err: useId() };

  const header = (
    <Eyebrow>
      {churchName} <span aria-hidden>·</span> {sermonTitle}
    </Eyebrow>
  );

  if (!open) {
    return (
      <Page>
        {header}
        <Heading className="mt-6">Replies for this sermon are closed.</Heading>
        <p className="text-ink-muted mt-4 text-lg">
          Thanks for scanning. Look for the code again next Sunday.
        </p>
      </Page>
    );
  }

  if (sent?.care)
    return (
      <CareScreen
        header={header}
        churchName={churchName}
        careContact={careContact}
        careFormUrl={careFormUrl}
      />
    );

  if (sent) {
    return (
      <Page>
        {header}
        <div className="flex flex-1 flex-col justify-center py-10">
          <div
            aria-hidden
            className="bg-clay-soft text-clay flex size-14 items-center justify-center rounded-full"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <Heading className="mt-6">Thank you.</Heading>
          <Eyebrow className="mt-6">You said</Eyebrow>
          <Quote className="mt-2">{sent.takeaway}</Quote>
          <p className="text-ink-muted mt-6 text-lg">
            Your pastor reads every reply this week.
            {sent.noteScheduled && " We'll send your words back to you Wednesday morning."}
          </p>
          {connectFormUrl && (
            <a
              href={connectFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card border-line bg-surface hover:border-ink-subtle mt-8 block border p-5"
            >
              <span className="block text-lg font-semibold">Take a next step at {churchName}</span>
              <span className="text-ink-muted mt-1 block text-base">
                New here, or want to get connected? Fill in the church&apos;s connect card.
              </span>
              <span className="text-clay mt-2 block text-base font-semibold">
                Open the connect card <span aria-hidden>→</span>
              </span>
            </a>
          )}
          <Verse className="mt-10" {...VERSES.lamp} />
        </div>
        <Button
          variant="secondary"
          full
          onClick={() => {
            setSent(null);
            setTakeaway("");
            setQuestion("");
          }}
        >
          Add another thought
        </Button>
      </Page>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!takeaway.trim()) {
      setErrors({ takeaway: "Tell us what will stick with you." });
      return;
    }
    if (wantsNote && !email.trim()) {
      setErrors({ email: "Add your email, or untick the Wednesday note." });
      return;
    }
    setSending(true);
    setErrors({});
    const result = await api<{ care: boolean; noteScheduled: boolean }>(`/api/r/${code}`, {
      body: {
        takeaway,
        question: question || undefined,
        email: wantsNote ? email : undefined,
        website: honeypot.current?.value || undefined,
      },
    });
    setSending(false);
    if (result.ok) {
      setSent({ takeaway: takeaway.trim(), ...result.data });
      return;
    }
    setErrors({
      takeaway: fieldError(result, "takeaway"),
      question: fieldError(result, "question"),
      email: fieldError(result, "email"),
      form: result.fields ? undefined : result.error,
    });
  }

  const remaining = MAX - takeaway.length;

  return (
    <Page>
      <OliveBranch className="text-gold/50 pointer-events-none absolute top-2 right-2 w-14" />
      <form onSubmit={submit} noValidate className="relative flex flex-1 flex-col">
        {header}
        <Heading className="mt-5">
          <label htmlFor={ids.takeaway}>What will stick with you?</label>
        </Heading>
        <p className="text-ink-muted mt-3 text-lg">
          A word, a line, a verse. However you&apos;d say it.
        </p>

        <textarea
          id={ids.takeaway}
          value={takeaway}
          onChange={(e) => setTakeaway(e.target.value)}
          maxLength={MAX}
          rows={5}
          required
          aria-invalid={Boolean(errors.takeaway)}
          aria-describedby={errors.takeaway ? `${ids.takeaway}-err` : undefined}
          placeholder="Type what stuck with you"
          className="rounded-field border-line bg-surface text-ink placeholder:text-ink-subtle focus:border-ink mt-6 w-full resize-none border-[1.5px] px-4 py-4 font-serif text-[1.3125rem] leading-snug focus:outline-none"
        />
        {remaining < 80 && (
          <p className="text-ink-subtle mt-1 text-right text-sm" aria-live="polite">
            {remaining} characters left
          </p>
        )}
        {errors.takeaway && <ErrorText id={`${ids.takeaway}-err`}>{errors.takeaway}</ErrorText>}

        <label htmlFor={ids.question} className="text-ink-muted mt-5 text-base font-medium">
          Any question it raised? <span className="text-ink-subtle font-normal">(optional)</span>
        </label>
        <textarea
          id={ids.question}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX}
          rows={2}
          placeholder="Something you're still wondering about"
          className="rounded-field border-line bg-surface text-ink placeholder:text-ink-subtle focus:border-ink mt-2 w-full resize-none border-[1.5px] px-4 py-3 font-serif text-lg leading-snug focus:outline-none"
        />
        {errors.question && <ErrorText>{errors.question}</ErrorText>}

        <label className="mt-6 flex cursor-pointer items-start gap-3.5">
          <input
            type="checkbox"
            checked={wantsNote}
            onChange={(e) => setWantsNote(e.target.checked)}
            className="accent-ink mt-0.5 size-6 shrink-0"
          />
          <span>
            <span className="block text-base font-medium">
              Send my words back to me on Wednesday
            </span>
            <span className="text-ink-subtle block text-sm">
              One email with the verse. We delete your address after 14 days.
            </span>
          </span>
        </label>
        {wantsNote && (
          <div className="mt-3">
            <label htmlFor={ids.email} className="sr-only">
              Your email
            </label>
            <input
              id={ids.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              className="rounded-field border-line bg-surface focus:border-ink h-14 w-full border-[1.5px] px-4 text-lg focus:outline-none"
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </div>
        )}

        {/* Hidden from people. Bots fill it in and get quietly ignored. */}
        <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label>
            Website
            <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="flex-1" />
        {errors.form && <ErrorText id={ids.err}>{errors.form}</ErrorText>}
        <Button type="submit" full className="mt-8" disabled={sending}>
          {sending ? "Sending" : "Send"}
        </Button>
        <p className="text-ink-subtle mt-3 text-center text-sm">
          Anonymous. Your pastor reads every reply. AI helps sort them.
        </p>
      </form>
    </Page>
  );
}

function CareScreen({
  header,
  churchName,
  careContact,
  careFormUrl,
}: {
  header: React.ReactNode;
  churchName: string;
  careContact: string | null;
  careFormUrl: string | null;
}) {
  return (
    <Page>
      {header}
      <Heading className="mt-8">Thank you for telling us.</Heading>
      <p className="text-ink-muted mt-4 text-lg">
        It sounds like you may be carrying something heavy. You don&apos;t have to carry it alone.
      </p>
      <section className="rounded-card bg-care-soft mt-7 p-5" aria-labelledby="crisis-heading">
        <p id="crisis-heading" className="text-care text-base font-semibold">
          If you&apos;re in danger or thinking about ending your life
        </p>
        <p className="mt-2 font-serif text-[1.375rem] leading-snug">
          Call or text 988, any time, day or night.
        </p>
        <a
          href="tel:988"
          className="rounded-button bg-care mt-4 inline-flex min-h-14 w-full items-center justify-center px-6 text-lg font-semibold text-white"
        >
          Call or text 988
        </a>
        <p className="text-ink-muted mt-3 text-sm">
          Outside the US, call your local emergency number.
        </p>
      </section>
      {careContact && (
        <section className="rounded-card border-line bg-surface mt-4 border p-5">
          <p className="text-lg font-semibold">Talk to someone at {churchName}</p>
          <p className="text-ink-muted mt-1 text-base">{careContact}</p>
        </section>
      )}
      {careFormUrl && (
        <section className="rounded-card border-line bg-surface mt-4 border p-5">
          <p className="text-lg font-semibold">Want someone to reach out?</p>
          <p className="text-ink-muted mt-1 text-base">
            Your reply here stays anonymous. On the church&apos;s own form you choose what to share
            and how they can reach you.
          </p>
          <a
            href={careFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-button border-line bg-surface text-ink hover:border-ink-subtle mt-4 inline-flex min-h-14 w-full items-center justify-center border-[1.5px] px-6 text-lg font-semibold"
          >
            Ask someone to reach out
          </a>
        </section>
      )}
      <div className="flex-1" />
      <p className="text-ink-subtle mt-8 text-center text-sm">
        Your reply is still anonymous. Your pastor will see it first in this week&apos;s replies.
      </p>
    </Page>
  );
}
