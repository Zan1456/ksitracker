CREATE TABLE "challenge_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL,
	"session_date" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"total_seconds" integer,
	"passed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"min_required" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_task_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"result_ms" integer,
	"result_reps" integer,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "challenge_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order" integer NOT NULL,
	"name" text NOT NULL,
	"note" text,
	"target_distance_meters" integer,
	"rank_direction" "rank_direction" NOT NULL,
	"result_kind" "result_kind" NOT NULL,
	CONSTRAINT "challenge_tasks_order_unique" UNIQUE("order")
);
--> statement-breakpoint
ALTER TABLE "workout_tasks" ADD COLUMN "rounds_config" jsonb;--> statement-breakpoint
ALTER TABLE "challenge_sessions" ADD CONSTRAINT "challenge_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_sessions" ADD CONSTRAINT "challenge_sessions_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_task_results" ADD CONSTRAINT "challenge_task_results_session_id_challenge_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."challenge_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_task_results" ADD CONSTRAINT "challenge_task_results_task_id_challenge_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."challenge_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_task_results_session_task_idx" ON "challenge_task_results" USING btree ("session_id","task_id");--> statement-breakpoint
-- Leaderboard tasks move out of workouts into the new global challenge_tasks
-- list (seeded separately). Drop the old in-workout stopwatch tasks and their
-- results — the leaderboard resets with the new challenge flow.
DELETE FROM "workout_tasks" WHERE "type" = 'stopwatch';