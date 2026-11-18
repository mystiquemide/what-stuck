import type { EmailMessage } from "@/lib/email";
import { emailLayout, escapeHtml } from "./html";

export function teamInviteEmail(input: {
  to: string;
  churchName: string;
  signInUrl: string;
}): EmailMessage {
  const line = `You've been added to the ${input.churchName} team on What Stuck. Each Monday you can see what people took home from the sermon, and any replies that may need care.`;
  return {
    to: input.to,
    subject: `You've been added to ${input.churchName} on What Stuck`,
    text: [line, "", `Sign in with this email address: ${input.signInUrl}`].join("\n"),
    html: emailLayout(
      `<p style="margin:0 0 16px;">${escapeHtml(line)}</p>
<p style="margin:0;"><a href="${escapeHtml(input.signInUrl)}" style="display:inline-block;background:#1c1917;color:#faf7f2;text-decoration:none;padding:12px 20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:16px;">Sign in</a></p>`,
      `Sign in with ${escapeHtml(input.to)}. If you weren't expecting this, you can ignore it.`,
    ),
  };
}
