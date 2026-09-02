ALTER TABLE "users" ADD COLUMN "sound_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reminder_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auto_rest_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_permissions" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_default_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token_expires_at" timestamp with time zone;