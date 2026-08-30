import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const taskTypeEnum = pgEnum("task_type", ["reps", "time", "stopwatch", "rest"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);
export const rankDirectionEnum = pgEnum("rank_direction", ["asc", "desc"]);
// For stopwatch tasks: whether the logged personal result is a duration (mm:ss.d)
// or a rep count (e.g. an AMRAP-style "how many in 60s" test).
export const resultKindEnum = pgEnum("result_kind", ["time", "reps"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

/**
 * One round's work amount + the rest after it, for tasks with a custom
 * per-round schedule (e.g. 30s work/30s rest, then 35s work/25s rest).
 * `work` is seconds for "time" tasks or a rep count for "reps" tasks.
 * `restSeconds` is null for "no rest after this round" (e.g. the last one).
 */
export type RoundConfig = { work: number; restSeconds: number | null };

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  isBanned: boolean("is_banned").notNull().default(false),
  // When set to today's date (by an admin), the user gets one extra workout
  // beyond the normal daily limit of one, for that day only.
  dailyBonusDate: date("daily_bonus_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const levels = pgTable("levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  index: integer("index").notNull().unique(), // 1, 2, 3
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
});

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    levelId: uuid("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    difficulty: difficultyEnum("difficulty").notNull().default("medium"),
    order: integer("order").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull().default(20),
  },
  (t) => [uniqueIndex("workouts_level_order_idx").on(t.levelId, t.order)]
);

export const workoutTasks = pgTable(
  "workout_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    name: text("name").notNull(),
    note: text("note"), // e.g. "90 fokos szög"
    type: taskTypeEnum("type").notNull(),
    // reps
    targetReps: integer("target_reps"),
    perSide: boolean("per_side").notNull().default(false), // e.g. "12+12 db"
    // time (countdown hold, e.g. plank-style timed task guided by the focus timer)
    targetSeconds: integer("target_seconds"),
    // stopwatch (leaderboard-eligible: user logs their own result)
    targetDistanceMeters: integer("target_distance_meters"),
    rankDirection: rankDirectionEnum("rank_direction"), // asc = lower is better, desc = higher is better
    resultKind: resultKindEnum("result_kind"), // time or reps, for stopwatch tasks
    rounds: integer("rounds").notNull().default(1),
    restSeconds: integer("rest_seconds"), // rest between rounds, when rounds > 1
    // Overrides `targetReps`/`targetSeconds` + `restSeconds` per round when
    // set (e.g. round 1 is 30s work/30s rest, round 2 is 35s work/25s rest).
    // Null keeps the legacy uniform-rounds behavior.
    roundsConfig: jsonb("rounds_config").$type<RoundConfig[]>(),
  },
  (t) => [uniqueIndex("workout_tasks_workout_order_idx").on(t.workoutId, t.order)]
);

export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  status: sessionStatusEnum("status").notNull().default("in_progress"),
  sessionDate: date("session_date").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  totalSeconds: integer("total_seconds"),
});

export const taskResults = pgTable(
  "task_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => workoutTasks.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    resultMs: integer("result_ms"), // stopwatch result, milliseconds
    resultReps: integer("result_reps"), // reps actually logged
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("task_results_session_task_idx").on(t.sessionId, t.taskId)]
);

// ---------------------------------------------------------------------------
// Challenge — a global set of leaderboard tasks presented at the end of every
// level. Unlike workout tasks, these live outside any single workout: the
// same task list reappears at the end of each level, and completing at least
// `challengeSettings.minRequired` of them (not necessarily all) is what
// unlocks the next level and posts results to the leaderboard.
// ---------------------------------------------------------------------------

export const challengeTasks = pgTable("challenge_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  order: integer("order").notNull().unique(),
  name: text("name").notNull(),
  note: text("note"),
  targetDistanceMeters: integer("target_distance_meters"),
  rankDirection: rankDirectionEnum("rank_direction").notNull(),
  resultKind: resultKindEnum("result_kind").notNull(),
});

// Single-row config table — how many of the challenge tasks must be
// completed in one attempt for it to count as passed.
export const challengeSettings = pgTable("challenge_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  minRequired: integer("min_required").notNull().default(1),
});

export const challengeSessions = pgTable("challenge_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Which level's gate this attempt was for — the task list itself is
  // shared across all levels.
  levelId: uuid("level_id")
    .notNull()
    .references(() => levels.id, { onDelete: "cascade" }),
  status: sessionStatusEnum("status").notNull().default("in_progress"),
  sessionDate: date("session_date").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  totalSeconds: integer("total_seconds"),
  // Whether at least `challengeSettings.minRequired` tasks were completed.
  passed: boolean("passed").notNull().default(false),
  // The subset of challengeTasks the user picked to attempt, in display
  // order — chosen up front when starting the session. Only these are shown
  // during the run; null on legacy sessions started before this existed
  // (treated as "all tasks" by callers).
  selectedTaskIds: jsonb("selected_task_ids").$type<string[]>(),
});

export const challengeTaskResults = pgTable(
  "challenge_task_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => challengeSessions.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => challengeTasks.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    resultMs: integer("result_ms"),
    resultReps: integer("result_reps"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("challenge_task_results_session_task_idx").on(t.sessionId, t.taskId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(workoutSessions),
  challengeSessions: many(challengeSessions),
}));

export const levelsRelations = relations(levels, ({ many }) => ({
  workouts: many(workouts),
  challengeSessions: many(challengeSessions),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  level: one(levels, { fields: [workouts.levelId], references: [levels.id] }),
  tasks: many(workoutTasks),
  sessions: many(workoutSessions),
}));

export const workoutTasksRelations = relations(workoutTasks, ({ one, many }) => ({
  workout: one(workouts, { fields: [workoutTasks.workoutId], references: [workouts.id] }),
  results: many(taskResults),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, { fields: [workoutSessions.userId], references: [users.id] }),
  workout: one(workouts, { fields: [workoutSessions.workoutId], references: [workouts.id] }),
  taskResults: many(taskResults),
}));

export const taskResultsRelations = relations(taskResults, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [taskResults.sessionId],
    references: [workoutSessions.id],
  }),
  task: one(workoutTasks, { fields: [taskResults.taskId], references: [workoutTasks.id] }),
}));

export const challengeTasksRelations = relations(challengeTasks, ({ many }) => ({
  results: many(challengeTaskResults),
}));

export const challengeSessionsRelations = relations(challengeSessions, ({ one, many }) => ({
  user: one(users, { fields: [challengeSessions.userId], references: [users.id] }),
  level: one(levels, { fields: [challengeSessions.levelId], references: [levels.id] }),
  taskResults: many(challengeTaskResults),
}));

export const challengeTaskResultsRelations = relations(challengeTaskResults, ({ one }) => ({
  session: one(challengeSessions, {
    fields: [challengeTaskResults.sessionId],
    references: [challengeSessions.id],
  }),
  task: one(challengeTasks, { fields: [challengeTaskResults.taskId], references: [challengeTasks.id] }),
}));

export type User = typeof users.$inferSelect;
export type Level = typeof levels.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutTask = typeof workoutTasks.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type TaskResult = typeof taskResults.$inferSelect;
export type ChallengeTask = typeof challengeTasks.$inferSelect;
export type ChallengeSettings = typeof challengeSettings.$inferSelect;
export type ChallengeSession = typeof challengeSessions.$inferSelect;
export type ChallengeTaskResult = typeof challengeTaskResults.$inferSelect;
