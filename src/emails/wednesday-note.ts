import type { EmailMessage } from "@/lib/email";
import type { Passage } from "@/scripture/passage";
import type { Locale } from "@/lib/locale";
import { BSB_NOTICE, RV1909_NOTICE } from "@/scripture/notice";
import { emailLayout, escapeHtml } from "./html";

export type WednesdayNoteInput = {
  to: string;
  churchName: string;
  sermonTitle: string;
  takeaway: string;
  reflectionQuestion: string;
  passage: Passage | null;
  unsubscribeUrl: string;
  /** The language the member replied in. The pastor's question stays as the pastor wrote it. */
  locale?: Locale;
};

const COPY = {
  en: {
    subject: (church: string) => `What stuck with you at ${church}`,
    youSaid: "On Sunday you said:",
    from: (ref: string) => `From ${ref}:`,
    readIt: "Read the passage",
    readHere: (url: string) => `Read it here: ${url}`,
    question: "One question to sit with this week:",
    footer: (sermon: string, church: string) =>
      `You asked for this one-time note after "${sermon}" at ${church}. Your email address is deleted within 14 days.`,
    notice: BSB_NOTICE,
    delete: "Delete my email now",
  },
  es: {
    subject: (church: string) => `Lo que te quedó en ${church}`,
    youSaid: "El domingo dijiste:",
    from: (ref: string) => `De ${ref}:`,
    readIt: "Lee el pasaje",
    readHere: (url: string) => `Léelo aquí: ${url}`,
    question: "Una pregunta para pensar esta semana:",
    footer: (sermon: string, church: string) =>
      `Pediste esta nota única después de "${sermon}" en ${church}. Tu correo se borra en un plazo de 14 días.`,
    notice: RV1909_NOTICE,
    delete: "Borrar mi correo ahora",
  },
} as const;

/**
 * The member's own words come back exactly as written. Nothing here is
 * rewritten by AI; the reflection question was approved by the pastor.
 */
export function wednesdayNote(input: WednesdayNoteInput): EmailMessage {
  const { passage } = input;
  const t = COPY[input.locale ?? "en"];
  const footer = t.footer(input.sermonTitle, input.churchName) + (passage ? ` ${t.notice}` : "");

  const textParts = [
    `${input.churchName} · ${input.sermonTitle}`,
    "",
    t.youSaid,
    "",
    `"${input.takeaway}"`,
    "",
  ];
  if (passage) {
    textParts.push(t.from(passage.reference), "");
    textParts.push(passage.text ?? t.readHere(passage.readUrl), "");
    textParts.push(`${passage.attribution}`, "");
  }
  textParts.push(
    t.question,
    input.reflectionQuestion,
    "",
    "----",
    footer,
    `${t.delete}: ${input.unsubscribeUrl}`,
  );

  const passageHtml = passage
    ? `<p style="margin:28px 0 8px;color:#57534e;">${escapeHtml(t.from(passage.reference))}</p>
${
  passage.text
    ? `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(passage.text)}</p>`
    : `<p style="margin:0;"><a href="${escapeHtml(passage.readUrl)}" style="color:#9a3412;">${t.readIt}</a></p>`
}
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#57534e;">${escapeHtml(passage.attribution)}</p>`
    : "";

  const html = emailLayout(
    `<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#57534e;">${escapeHtml(input.churchName)} · ${escapeHtml(input.sermonTitle)}</p>
<p style="margin:0 0 8px;color:#57534e;">${t.youSaid}</p>
<p style="margin:0;font-size:26px;line-height:1.35;">&ldquo;${escapeHtml(input.takeaway)}&rdquo;</p>
${passageHtml}
<p style="margin:28px 0 8px;color:#57534e;">${t.question}</p>
<p style="margin:0;font-weight:bold;">${escapeHtml(input.reflectionQuestion)}</p>`,
    `${escapeHtml(footer)}<br><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#57534e;">${t.delete}</a>`,
    input.locale ?? "en",
  );

  return {
    to: input.to,
    subject: t.subject(input.churchName),
    text: textParts.join("\n"),
    html,
    headers: {
      "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
