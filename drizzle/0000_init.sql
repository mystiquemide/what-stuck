CREATE TYPE "public"."report_status" AS ENUM('ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TYPE "public"."sermon_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "churches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'America/Chicago' NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "churches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"email" text NOT NULL,
	"send_after" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"unsub_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "followups_response_id_unique" UNIQUE("response_id"),
	CONSTRAINT "followups_unsub_token_hash_unique" UNIQUE("unsub_token_hash")
);
--> statement-breakpoint
CREATE TABLE "login_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "login_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"user_id" uuid NOT NULL,
	"church_id" uuid NOT NULL,
	"role" "role" DEFAULT 'editor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_id_church_id_pk" PRIMARY KEY("user_id","church_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key_hash" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_hash_window_start_pk" PRIMARY KEY("key_hash","window_start")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sermon_id" uuid NOT NULL,
	"status" "report_status" NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"body" jsonb,
	"response_count" integer NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sermon_id" uuid NOT NULL,
	"takeaway" text NOT NULL,
	"question" text,
	"care_flag" boolean DEFAULT false NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "responses_takeaway_length" CHECK (char_length("responses"."takeaway") between 1 and 500),
	CONSTRAINT "responses_question_length" CHECK ("responses"."question" is null or char_length("responses"."question") between 1 and 500)
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"church_id" uuid NOT NULL,
	"series_id" uuid,
	"title" text NOT NULL,
	"preached_on" date NOT NULL,
	"scripture_ref" text,
	"intended_takeaway" text NOT NULL,
	"reflection_question" text,
	"reflection_approved_at" timestamp with time zone,
	"public_code" text NOT NULL,
	"status" "sermon_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sermons_public_code_unique" UNIQUE("public_code"),
	CONSTRAINT "sermons_takeaway_length" CHECK (char_length("sermons"."intended_takeaway") between 1 and 280),
	CONSTRAINT "sermons_title_length" CHECK (char_length("sermons"."title") between 1 and 120)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email"))
);
--> statement-breakpoint
ALTER TABLE "followups" ADD CONSTRAINT "followups_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_sermon_id_sermons_id_fk" FOREIGN KEY ("sermon_id") REFERENCES "public"."sermons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_sermon_id_sermons_id_fk" FOREIGN KEY ("sermon_id") REFERENCES "public"."sermons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermons" ADD CONSTRAINT "sermons_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermons" ADD CONSTRAINT "sermons_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "followups_due_idx" ON "followups" USING btree ("send_after") WHERE "followups"."sent_at" is null;--> statement-breakpoint
CREATE INDEX "reports_sermon_idx" ON "reports" USING btree ("sermon_id","created_at");--> statement-breakpoint
CREATE INDEX "responses_sermon_idx" ON "responses" USING btree ("sermon_id");--> statement-breakpoint
CREATE INDEX "series_church_idx" ON "series" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX "sermons_church_idx" ON "sermons" USING btree ("church_id","preached_on");--> statement-breakpoint
CREATE INDEX "sermons_series_idx" ON "sermons" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");