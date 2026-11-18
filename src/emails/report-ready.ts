import type { EmailMessage } from "@/lib/email";
import { emailLayout, escapeHtml } from "./html";

export function reportReadyEmail(input: {
  to: string;
  sermonTitle: string;
  replyCount: number;
  questionCount: number;
  careCount: number;
  reportUrl: string;
}): EmailMessage {
  const lines = [
    `${input.replyCount} people told you what stuck from "${input.sermonTitle}".`,
    input.questionCount ? `${input.questionCount} of them are still carrying a question.` : null,
    input.careCount
      ? `${input.careCount} ${input.careCount === 1 ? "reply may need" : "replies may need"} your care. They're at the top of the report.`
      : null,
  ].filter(Boolean) as string[];

  return {
    to: input.to,
    subject: `What stuck from "${input.sermonTitle}"`,
    text: [...lines, "", `Read the report: ${input.reportUrl}`].join("\n"),
    html: emailLayout(
      `${lines.map((l) => `<p style="margin:0 0 12px;">${escapeHtml(l)}</p>`).join("\n")}
<p style="margin:24px 0 0;"><a href="${escapeHtml(input.reportUrl)}" style="display:inline-block;background:#9a3412;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:16px;">Read the report</a></p>`,
      "The summary is organized by AI. Every theme links to the real replies behind it.",
    ),
  };
}
