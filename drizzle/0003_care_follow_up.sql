ALTER TABLE "responses" ADD COLUMN "care_handled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "care_handled_by" uuid;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "care_note" text;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_care_handled_by_users_id_fk" FOREIGN KEY ("care_handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;