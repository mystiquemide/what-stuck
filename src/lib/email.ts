import "server-only";
import { features, getEnv } from "./env";

export type EmailMessage = { to: string; subject: string; text: string; html?: string };

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email sending is not configured (RESEND_API_KEY, EMAIL_FROM).");
  }
}

/** Sends through Resend's HTTP API. No SDK needed for one endpoint. */
class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, ...message }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // Status only: the response body can echo the recipient address.
      throw new Error(`Email provider rejected the message (HTTP ${response.status}).`);
    }
  }
}

/** Local development without a key: print the message so sign-in links still work. */
class ConsoleMailer implements Mailer {
  async send(message: EmailMessage): Promise<void> {
    console.info(`[email:dev] to=${message.to} subject="${message.subject}"\n${message.text}`);
  }
}

export function getMailer(): Mailer {
  const env = getEnv();
  if (features(env).email) return new ResendMailer(env.RESEND_API_KEY!, env.EMAIL_FROM!);
  if (env.NODE_ENV !== "production") return new ConsoleMailer();
  throw new EmailNotConfiguredError();
}
