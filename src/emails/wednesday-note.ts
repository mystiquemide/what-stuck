import type { EmailMessage } from "@/lib/email";
import type { Passage } from "@/scripture/passage";
import { BSB_NOTICE } from "@/scripture/notice";
import { emailLayout, escapeHtml } from "./html";

export type WednesdayNoteInput = {
  to: string;
  churchName: string;
  sermonTitle: string;
  takeaway: string;
  reflectionQuestion: string;
  passage: Passage | null;
  unsubscribeUrl: string;
};

/**
 * The member's own words come back exactly as written. Nothing here is
 * rewritten by AI; the reflection question was approved by the pastor.
 */
export function wednesdayNote(input: WednesdayNoteInput): EmailMessage {
  const { passage } = input;
  const footer =
    `You asked for this one-time note after "${input.sermonTitle}" at ${input.churchName}. Your email address is deleted within 14 days.` +
    (passage ? ` ${BSB_NOTICE}` : "");

  const textParts = [
    `${input.churchName} · ${input.sermonTitle}`,
    "",
    "On Sunday you said:",
    "",
    `"${input.takeaway}"`,
    "",
  ];
  if (passage) {
    textParts.push(`From ${passage.reference}:`, "");
    textParts.push(passage.text ?? `Read it here: ${passage.readUrl}`, "");
    textParts.push(`${passage.attribution}`, "");
  }
  textParts.push(
    "One question to sit with this week:",
    input.reflectionQuestion,
    "",
    "----",
    footer,
    `Delete my email now: ${input.unsubscribeUrl}`,
  );

  const passageHtml = passage
    ? `<p style="margin:28px 0 8px;color:#57534e;">From ${escapeHtml(passage.reference)}:</p>
${
  passage.text
    ? `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(passage.text)}</p>`
    : `<p style="margin:0;"><a href="${escapeHtml(passage.readUrl)}" style="color:#9a3412;">Read the passage</a></p>`
}
<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#57534e;">${escapeHtml(passage.attribution)}</p>`
    : "";

  const html = emailLayout(
    `<p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#57534e;">${escapeHtml(input.churchName)} · ${escapeHtml(input.sermonTitle)}</p>
<p style="margin:0 0 8px;color:#57534e;">On Sunday you said:</p>
<p style="margin:0;font-size:26px;line-height:1.35;">&ldquo;${escapeHtml(input.takeaway)}&rdquo;</p>
${passageHtml}
<p style="margin:28px 0 8px;color:#57534e;">One question to sit with this week:</p>
<p style="margin:0;font-weight:bold;">${escapeHtml(input.reflectionQuestion)}</p>`,
    `${escapeHtml(footer)}<br><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#57534e;">Delete my email now</a>`,
  );

  return {
    to: input.to,
    subject: `What stuck with you at ${input.churchName}`,
    text: textParts.join("\n"),
    html,
    headers: {
      "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
