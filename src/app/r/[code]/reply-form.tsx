"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Button, ErrorText, Eyebrow, Heading, Page, Quote } from "@/components/ui";
import { OliveBranch } from "@/components/landing/ornaments";
import { Verse } from "@/components/verse";
import { api, fieldError } from "@/lib/client-api";
import type { Locale } from "@/lib/locale";
import { REPLY_COPY, translateServerMessage, type ReplyCopy } from "./copy";

type Props = {
  code: string;
  churchName: string;
  sermonTitle: string;
  open: boolean;
  careContact: string | null;
  careFormUrl: string | null;
  connectFormUrl: string | null;
  /** From the phone's language settings. The member can switch. */
  initialLocale: Locale;
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
  initialLocale,
}: Props) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
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
  const t = REPLY_COPY[locale];

  const header = (
    <div className="flex items-start justify-between gap-3">
      <Eyebrow>
        {churchName} <span aria-hidden>·</span> {sermonTitle}
      </Eyebrow>
      <div className="flex shrink-0 items-start">
        <OliveBranch className="text-gold/50 pointer-events-none -mt-2 w-9" />
        <button
          type="button"
          onClick={() => {
            setLocale(locale === "en" ? "es" : "en");
            setErrors({});
          }}
          lang={locale === "en" ? "es" : "en"}
          className="text-ink-muted hover:text-ink relative -mt-3 -mr-3 min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium underline underline-offset-4"
        >
          {t.switchTo}
        </button>
      </div>
    </div>
  );

  if (!open) {
    return (
      <Page lang={locale}>
        {header}
        <Heading className="mt-6">{t.closedHeading}</Heading>
        <p className="text-ink-muted mt-4 text-lg">{t.closedBody}</p>
      </Page>
    );
  }

  if (sent?.care)
    return (
      <CareScreen
        t={t}
        locale={locale}
        header={header}
        churchName={churchName}
        careContact={careContact}
        careFormUrl={careFormUrl}
      />
    );

  if (sent) {
    return (
      <Page lang={locale}>
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
          <Heading className="mt-6">{t.thanks}</Heading>
          <Eyebrow className="mt-6">{t.youSaid}</Eyebrow>
          <Quote className="mt-2">{sent.takeaway}</Quote>
          <p className="text-ink-muted mt-6 text-lg">
            {t.pastorReads}
            {sent.noteScheduled && t.noteScheduled}
          </p>
          {connectFormUrl && (
            <a
              href={connectFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card border-line bg-surface hover:border-ink-subtle mt-8 block border p-5"
            >
              <span className="block text-lg font-semibold">{t.nextStepTitle(churchName)}</span>
              <span className="text-ink-muted mt-1 block text-base">{t.nextStepBody}</span>
              <span className="text-clay mt-2 block text-base font-semibold">
                {t.nextStepLink} <span aria-hidden>→</span>
              </span>
            </a>
          )}
          <Verse className="mt-10" {...t.verse} />
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
          {t.another}
        </Button>
      </Page>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!takeaway.trim()) {
      setErrors({ takeaway: t.emptyTakeaway });
      return;
    }
    if (wantsNote && !email.trim()) {
      setErrors({ email: t.emptyEmail });
      return;
    }
    setSending(true);
    setErrors({});
    const result = await api<{ care: boolean; noteScheduled: boolean }>(`/api/r/${code}`, {
      body: {
        takeaway,
        question: question || undefined,
        email: wantsNote ? email : undefined,
        locale,
        website: honeypot.current?.value || undefined,
      },
    });
    setSending(false);
    if (result.ok) {
      setSent({ takeaway: takeaway.trim(), ...result.data });
      return;
    }
    const say = (message: string | undefined) => translateServerMessage(message, locale);
    setErrors({
      takeaway: say(fieldError(result, "takeaway")),
      question: say(fieldError(result, "question")),
      email: say(fieldError(result, "email")),
      form: result.fields ? undefined : say(result.error),
    });
  }

  const remaining = MAX - takeaway.length;

  return (
    <Page lang={locale}>
      <form onSubmit={submit} noValidate className="relative flex flex-1 flex-col">
        {header}
        <Heading className="mt-5">
          <label htmlFor={ids.takeaway}>{t.heading}</label>
        </Heading>
        <p className="text-ink-muted mt-3 text-lg">{t.sub}</p>

        <textarea
          id={ids.takeaway}
          value={takeaway}
          onChange={(e) => setTakeaway(e.target.value)}
          maxLength={MAX}
          rows={5}
          required
          aria-invalid={Boolean(errors.takeaway)}
          aria-describedby={errors.takeaway ? `${ids.takeaway}-err` : undefined}
          placeholder={t.takeawayPlaceholder}
          className="rounded-field border-line bg-surface text-ink placeholder:text-ink-subtle focus:border-ink mt-6 w-full resize-none border-[1.5px] px-4 py-4 font-serif text-[1.3125rem] leading-snug focus:outline-none"
        />
        {remaining < 80 && (
          <p className="text-ink-subtle mt-1 text-right text-sm" aria-live="polite">
            {t.charsLeft(remaining)}
          </p>
        )}
        {errors.takeaway && <ErrorText id={`${ids.takeaway}-err`}>{errors.takeaway}</ErrorText>}

        <label htmlFor={ids.question} className="text-ink-muted mt-5 text-base font-medium">
          {t.questionLabel} <span className="text-ink-subtle font-normal">{t.optional}</span>
        </label>
        <textarea
          id={ids.question}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX}
          rows={2}
          placeholder={t.questionPlaceholder}
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
            <span className="block text-base font-medium">{t.noteLabel}</span>
            <span className="text-ink-subtle block text-sm">{t.noteHint}</span>
          </span>
        </label>
        {wantsNote && (
          <div className="mt-3">
            <label htmlFor={ids.email} className="sr-only">
              {t.emailLabel}
            </label>
            <input
              id={ids.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
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
          {sending ? t.sending : t.send}
        </Button>
        <p className="text-ink-subtle mt-3 text-center text-sm">{t.footer}</p>
      </form>
    </Page>
  );
}

function CareScreen({
  t,
  locale,
  header,
  churchName,
  careContact,
  careFormUrl,
}: {
  t: ReplyCopy;
  locale: Locale;
  header: React.ReactNode;
  churchName: string;
  careContact: string | null;
  careFormUrl: string | null;
}) {
  return (
    <Page lang={locale}>
      {header}
      <Heading className="mt-8">{t.careHeading}</Heading>
      <p className="text-ink-muted mt-4 text-lg">{t.careBody}</p>
      <section className="rounded-card bg-care-soft mt-7 p-5" aria-labelledby="crisis-heading">
        <p id="crisis-heading" className="text-care text-base font-semibold">
          {t.crisisTitle}
        </p>
        <p className="mt-2 font-serif text-[1.375rem] leading-snug">{t.crisisLine}</p>
        <a
          href="tel:988"
          className="rounded-button bg-care mt-4 inline-flex min-h-14 w-full items-center justify-center px-6 text-lg font-semibold text-white"
        >
          {t.crisisCall}
        </a>
        {t.crisisText && (
          <a
            href="sms:988?&body=AYUDA"
            className="text-care mt-3 block text-center text-base font-semibold underline underline-offset-4"
          >
            {t.crisisText}
          </a>
        )}
        <p className="text-ink-muted mt-3 text-sm">{t.crisisOutside}</p>
      </section>
      {careContact && (
        <section className="rounded-card border-line bg-surface mt-4 border p-5">
          <p className="text-lg font-semibold">{t.talkTo(churchName)}</p>
          <p className="text-ink-muted mt-1 text-base">{careContact}</p>
        </section>
      )}
      {careFormUrl && (
        <section className="rounded-card border-line bg-surface mt-4 border p-5">
          <p className="text-lg font-semibold">{t.reachOutTitle}</p>
          <p className="text-ink-muted mt-1 text-base">{t.reachOutBody}</p>
          <a
            href={careFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-button border-line bg-surface text-ink hover:border-ink-subtle mt-4 inline-flex min-h-14 w-full items-center justify-center border-[1.5px] px-6 text-lg font-semibold"
          >
            {t.reachOutButton}
          </a>
        </section>
      )}
      <div className="flex-1" />
      <p className="text-ink-subtle mt-8 text-center text-sm">{t.careFooter}</p>
    </Page>
  );
}
