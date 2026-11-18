import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const LIMITS = {
  intendedTakeaway: 280,
  takeaway: 500,
  question: 500,
  title: 120,
  scriptureRef: 60,
} as const;

export const roleEnum = pgEnum("role", ["owner", "editor"]);
export const sermonStatusEnum = pgEnum("sermon_status", ["open", "closed"]);
export const reportStatusEnum = pgEnum("report_status", ["ready", "failed"]);

export const churches = pgTable("churches", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").notNull().default("America/Chicago"),
  /** Shown to a member whose reply suggests they need help, next to crisis lines. */
  careContact: text("care_contact"),
  /** The church's own prayer or care form (MinistryForms, Genesis ChMS or any form). Offered after a care reply. */
  careFormUrl: text("care_form_url"),
  /** The church's own connect card or next-steps form. Offered on the thank-you screen. */
  connectFormUrl: text("connect_form_url"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [check("users_email_lowercase", sql`${t.email} = lower(${t.email})`)],
);

export const memberships = pgTable(
  "memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("editor"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.churchId] })],
);

/** One-time sign-in links. Only a hash of the token is stored. */
export const loginTokens = pgTable("login_tokens", {
  id: id(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/** Signed-in sessions. Only a hash of the cookie value is stored. */
export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const series = pgTable(
  "series",
  {
    id: id(),
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("series_church_idx").on(t.churchId)],
);

export const sermons = pgTable(
  "sermons",
  {
    id: id(),
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    seriesId: uuid("series_id").references(() => series.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    preachedOn: date("preached_on").notNull(),
    scriptureRef: text("scripture_ref"),
    intendedTakeaway: text("intended_takeaway").notNull(),
    reflectionQuestion: text("reflection_question"),
    reflectionApprovedAt: timestamp("reflection_approved_at", { withTimezone: true }),
    publicCode: text("public_code").notNull().unique(),
    status: sermonStatusEnum("status").notNull().default("open"),
    createdAt: createdAt(),
  },
  (t) => [
    index("sermons_church_idx").on(t.churchId, t.preachedOn),
    index("sermons_series_idx").on(t.seriesId),
    check(
      "sermons_takeaway_length",
      sql`char_length(${t.intendedTakeaway}) between 1 and ${sql.raw(String(LIMITS.intendedTakeaway))}`,
    ),
    check(
      "sermons_title_length",
      sql`char_length(${t.title}) between 1 and ${sql.raw(String(LIMITS.title))}`,
    ),
  ],
);

/** What members said. Anonymous: no names, no contact details here. */
export const responses = pgTable(
  "responses",
  {
    id: id(),
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" }),
    takeaway: text("takeaway").notNull(),
    question: text("question"),
    careFlag: boolean("care_flag").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("responses_sermon_idx").on(t.sermonId),
    check(
      "responses_takeaway_length",
      sql`char_length(${t.takeaway}) between 1 and ${sql.raw(String(LIMITS.takeaway))}`,
    ),
    check(
      "responses_question_length",
      sql`${t.question} is null or char_length(${t.question}) between 1 and ${sql.raw(String(LIMITS.question))}`,
    ),
  ],
);

/**
 * Opt-in Wednesday notes. Kept apart from responses so contact details can
 * be deleted on schedule without touching the anonymous reply.
 */
export const followups = pgTable(
  "followups",
  {
    id: id(),
    responseId: uuid("response_id")
      .notNull()
      .unique()
      .references(() => responses.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    sendAfter: timestamp("send_after", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    unsubTokenHash: text("unsub_token_hash").notNull().unique(),
    createdAt: createdAt(),
  },
  (t) => [
    index("followups_due_idx")
      .on(t.sendAfter)
      .where(sql`${t.sentAt} is null`),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: id(),
    sermonId: uuid("sermon_id")
      .notNull()
      .references(() => sermons.id, { onDelete: "cascade" }),
    status: reportStatusEnum("status").notNull(),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    body: jsonb("body"),
    responseCount: integer("response_count").notNull(),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("reports_sermon_idx").on(t.sermonId, t.createdAt)],
);

/** Fixed-window counters. The key is a salted hash, never a raw IP. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    keyHash: text("key_hash").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.keyHash, t.windowStart] })],
);
