CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
ALTER TABLE "workout_tasks" ADD COLUMN "per_side" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_tasks" ADD COLUMN "rest_seconds" integer;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "difficulty" "difficulty" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workout_tasks_workout_order_idx" ON "workout_tasks" USING btree ("workout_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "workouts_level_order_idx" ON "workouts" USING btree ("level_id","order");