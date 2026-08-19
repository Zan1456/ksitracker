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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const taskTypeEnum = pgEnum("task_type", ["reps", "time", "stopwatch"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);
export const rankDirectionEnum = pgEnum("rank_direction", ["asc", "desc"]);
// For stopwatch tasks: whether the logged personal result is a duration (mm:ss.d)
// or a rep count (e.g. an AMRAP-style "how many in 60s" test).
export const resultKindEnum = pgEnum("result_kind", ["time", "reps"]);

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

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  levelId: uuid("level_id")
    .notNull()
    .references(() => levels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(20),
});

export const workoutTasks = pgTable("workout_tasks", {
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
  // time (countdown hold, e.g. plank-style timed task guided by the focus timer)
  targetSeconds: integer("target_seconds"),
  // stopwatch (leaderboard-eligible: user logs their own result)
  targetDistanceMeters: integer("target_distance_meters"),
  rankDirection: rankDirectionEnum("rank_direction"), // asc = lower is better, desc = higher is better
  resultKind: resultKindEnum("result_kind"), // time or reps, for stopwatch tasks
  rounds: integer("rounds").notNull().default(1),
});

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

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(workoutSessions),
}));

export const levelsRelations = relations(levels, ({ many }) => ({
  workouts: many(workouts),
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

export type User = typeof users.$inferSelect;
export type Level = typeof levels.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutTask = typeof workoutTasks.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type TaskResult = typeof taskResults.$inferSelect;
