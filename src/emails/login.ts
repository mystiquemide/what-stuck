import type { EmailMessage } from "@/lib/email";

export function loginEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: "Your What Stuck sign-in link",
    text: [
      "Here's your link to sign in to What Stuck:",
      "",
      link,
      "",
      "It works once and expires in 15 minutes.",
      "If you didn't ask for this, you can ignore this email.",
    ].join("\n"),
  };
}
