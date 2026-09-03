ALTER TABLE "users" ALTER COLUMN "sound_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "auto_rest_enabled" SET DEFAULT false;--> statement-breakpoint
-- Backfill existing rows to the new defaults too — these toggles only just
-- shipped, so no one has had a real chance to deliberately opt out yet.
UPDATE "users" SET "sound_enabled" = true, "auto_rest_enabled" = false;