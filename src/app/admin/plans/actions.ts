"use server";

import { z } from "zod";
import { asc, desc, eq, gt, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { levels, workouts, workoutTasks, type RoundConfig } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";

export type PlanFormState = { error?: string; success?: boolean } | undefined;

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

const levelSchema = z.object({
  name: z.string().trim().min(1, "Adj meg egy nevet."),
  description: z.string().trim().optional(),
});

export async function createLevelAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const parsed = levelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const existing = await db.select().from(levels);
  const nextSeq = existing.length + 1;

  const [created] = await db
    .insert(levels)
    .values({ index: nextSeq, order: nextSeq, name: parsed.data.name, description: parsed.data.description })
    .returning();

  revalidatePath("/admin/plans");
  redirect(`/admin/plans/levels/${created.id}`);
}

export async function updateLevelAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const levelId = formData.get("levelId") as string;
  const parsed = levelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  await db
    .update(levels)
    .set({ name: parsed.data.name, description: parsed.data.description })
    .where(eq(levels.id, levelId));

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/levels/${levelId}`);
  return { success: true };
}

async function renumberLevels() {
  const all = await db.select().from(levels).orderBy(asc(levels.order));
  for (let i = 0; i < all.length; i++) {
    const seq = i + 1;
    if (all[i].index !== seq || all[i].order !== seq) {
      // Temp negative value first to dodge the unique index on `index`.
      await db.update(levels).set({ index: -(i + 1000) }).where(eq(levels.id, all[i].id));
      await db.update(levels).set({ index: seq, order: seq }).where(eq(levels.id, all[i].id));
    }
  }
}

export async function deleteLevelAction(levelId: string) {
  await requireAdmin("workouts");
  await db.delete(levels).where(eq(levels.id, levelId));
  await renumberLevels();
  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function reorderLevelAction(levelId: string, direction: "up" | "down") {
  await requireAdmin("workouts");
  const [current] = await db.select().from(levels).where(eq(levels.id, levelId)).limit(1);
  if (!current) return;

  const [neighbor] =
    direction === "up"
      ? await db
          .select()
          .from(levels)
          .where(lt(levels.order, current.order))
          .orderBy(desc(levels.order))
          .limit(1)
      : await db
          .select()
          .from(levels)
          .where(gt(levels.order, current.order))
          .orderBy(asc(levels.order))
          .limit(1);
  if (!neighbor) return;

  await db.update(levels).set({ index: -1, order: -1 }).where(eq(levels.id, current.id));
  await db.update(levels).set({ index: current.index, order: current.order }).where(eq(levels.id, neighbor.id));
  await db.update(levels).set({ index: neighbor.index, order: neighbor.order }).where(eq(levels.id, current.id));

  revalidatePath("/admin/plans");
}

// ---------------------------------------------------------------------------
// Workouts
// ---------------------------------------------------------------------------

const workoutSchema = z.object({
  name: z.string().trim().min(1, "Adj meg egy nevet."),
  description: z.string().trim().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimatedMinutes: z.coerce.number().int().min(1).max(180),
});

export async function createWorkoutAction(
  levelId: string,
  _prev: PlanFormState,
  formData: FormData
): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const parsed = workoutSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    difficulty: formData.get("difficulty"),
    estimatedMinutes: formData.get("estimatedMinutes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const siblings = await db.select().from(workouts).where(eq(workouts.levelId, levelId));
  const nextOrder = siblings.reduce((max, w) => Math.max(max, w.order), -1) + 1;

  const [created] = await db
    .insert(workouts)
    .values({ levelId, order: nextOrder, ...parsed.data })
    .returning();

  revalidatePath("/admin/plans");
  redirect(`/admin/plans/workouts/${created.id}`);
}

export async function updateWorkoutAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const workoutId = formData.get("workoutId") as string;
  const parsed = workoutSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    difficulty: formData.get("difficulty"),
    estimatedMinutes: formData.get("estimatedMinutes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  await db.update(workouts).set(parsed.data).where(eq(workouts.id, workoutId));

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/workouts/${workoutId}`);
  return { success: true };
}

export async function deleteWorkoutAction(levelId: string, workoutId: string) {
  await requireAdmin("workouts");
  await db.delete(workouts).where(eq(workouts.id, workoutId));
  revalidatePath("/admin/plans");
  redirect(`/admin/plans/levels/${levelId}`);
}

export async function reorderWorkoutAction(workoutId: string, direction: "up" | "down") {
  await requireAdmin("workouts");
  const [current] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
  if (!current) return;

  const candidates = await db
    .select()
    .from(workouts)
    .where(eq(workouts.levelId, current.levelId))
    .orderBy(asc(workouts.order));
  const idx = candidates.findIndex((w) => w.id === workoutId);
  const neighbor = direction === "up" ? candidates[idx - 1] : candidates[idx + 1];
  if (!neighbor) return;

  await db.update(workouts).set({ order: -1 }).where(eq(workouts.id, current.id));
  await db.update(workouts).set({ order: current.order }).where(eq(workouts.id, neighbor.id));
  await db.update(workouts).set({ order: neighbor.order }).where(eq(workouts.id, current.id));

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/levels/${current.levelId}`);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const taskSchema = z
  .object({
    name: z.string().trim().min(1, "Adj meg egy nevet."),
    note: z.string().trim().optional(),
    type: z.enum(["reps", "time", "rest"]),
    targetReps: z.coerce.number().int().min(1).optional(),
    perSide: z.coerce.boolean().optional(),
    targetSeconds: z.coerce.number().int().min(1).optional(),
    rounds: z.coerce.number().int().min(1).max(20).default(1),
    restSeconds: z.coerce.number().int().min(1).max(600).optional(),
    // Per-round work/rest schedule (e.g. round 1 = 30s work/30s rest, round
    // 2 = 35s work/25s rest) — overrides the uniform target/rest above.
    customRounds: z.coerce.boolean().optional(),
    roundWork: z.array(z.coerce.number().int().min(1)).optional().default([]),
    roundRest: z.array(z.string()).optional().default([]),
  })
  .refine((v) => v.type !== "reps" || !!v.targetReps, {
    message: "Add meg az ismétlésszámot.",
    path: ["targetReps"],
  })
  .refine((v) => v.type !== "time" || !!v.targetSeconds, {
    message: "Add meg az időtartamot (mp).",
    path: ["targetSeconds"],
  })
  .refine((v) => v.type !== "rest" || !!v.targetSeconds, {
    message: "Add meg a pihenő időtartamát (mp).",
    path: ["targetSeconds"],
  })
  .refine((v) => !v.customRounds || v.rounds <= 1 || v.roundWork.length === v.rounds, {
    message: "Add meg minden körhöz az értéket.",
    path: ["roundWork"],
  });

function taskFormToValues(formData: FormData) {
  return {
    name: formData.get("name"),
    note: formData.get("note") || undefined,
    type: formData.get("type"),
    targetReps: formData.get("targetReps") || undefined,
    perSide: formData.get("perSide") === "on",
    targetSeconds: formData.get("targetSeconds") || undefined,
    rounds: formData.get("rounds") || 1,
    restSeconds: formData.get("restSeconds") || undefined,
    customRounds: formData.get("customRounds") === "on",
    roundWork: formData.getAll("roundWork"),
    roundRest: formData.getAll("roundRest"),
  };
}

/** Null out the fields that don't apply to the selected task type. */
function normalizeTaskValues(v: z.infer<typeof taskSchema>) {
  const useCustomRounds = !!v.customRounds && v.rounds > 1 && v.roundWork.length === v.rounds;
  const roundsConfig: RoundConfig[] | null = useCustomRounds
    ? v.roundWork.map((work, i) => ({
        work,
        restSeconds: v.roundRest[i] ? Number(v.roundRest[i]) : null,
      }))
    : null;

  return {
    name: v.name,
    note: v.note || null,
    type: v.type,
    targetReps: v.type === "reps" ? (roundsConfig ? roundsConfig[0].work : v.targetReps ?? null) : null,
    perSide: v.type === "reps" ? !!v.perSide : false,
    targetSeconds:
      v.type === "time" || v.type === "rest"
        ? roundsConfig
          ? roundsConfig[0].work
          : v.targetSeconds ?? null
        : null,
    targetDistanceMeters: null,
    rankDirection: null,
    resultKind: null,
    rounds: v.rounds,
    restSeconds: roundsConfig ? roundsConfig[0].restSeconds : v.rounds > 1 ? v.restSeconds ?? null : null,
    roundsConfig,
  };
}

export async function createTaskAction(
  workoutId: string,
  _prev: PlanFormState,
  formData: FormData
): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const parsed = taskSchema.safeParse(taskFormToValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const siblings = await db.select().from(workoutTasks).where(eq(workoutTasks.workoutId, workoutId));
  const nextOrder = siblings.reduce((max, t) => Math.max(max, t.order), -1) + 1;

  await db
    .insert(workoutTasks)
    .values({ workoutId, order: nextOrder, ...normalizeTaskValues(parsed.data) });

  revalidatePath(`/admin/plans/workouts/${workoutId}`);
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function updateTaskAction(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const taskId = formData.get("taskId") as string;
  const parsed = taskSchema.safeParse(taskFormToValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const [task] = await db.select().from(workoutTasks).where(eq(workoutTasks.id, taskId)).limit(1);
  if (!task) return { error: "A feladat nem található." };

  await db.update(workoutTasks).set(normalizeTaskValues(parsed.data)).where(eq(workoutTasks.id, taskId));

  revalidatePath(`/admin/plans/workouts/${task.workoutId}`);
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function deleteTaskAction(workoutId: string, taskId: string) {
  await requireAdmin("workouts");
  await db.delete(workoutTasks).where(eq(workoutTasks.id, taskId));
  revalidatePath(`/admin/plans/workouts/${workoutId}`);
  revalidatePath("/admin/plans");
}

export async function reorderTaskAction(taskId: string, direction: "up" | "down") {
  await requireAdmin("workouts");
  const [current] = await db.select().from(workoutTasks).where(eq(workoutTasks.id, taskId)).limit(1);
  if (!current) return;

  const candidates = await db
    .select()
    .from(workoutTasks)
    .where(eq(workoutTasks.workoutId, current.workoutId))
    .orderBy(asc(workoutTasks.order));
  const idx = candidates.findIndex((t) => t.id === taskId);
  const neighbor = direction === "up" ? candidates[idx - 1] : candidates[idx + 1];
  if (!neighbor) return;

  await db.update(workoutTasks).set({ order: -1 }).where(eq(workoutTasks.id, current.id));
  await db.update(workoutTasks).set({ order: current.order }).where(eq(workoutTasks.id, neighbor.id));
  await db.update(workoutTasks).set({ order: neighbor.order }).where(eq(workoutTasks.id, current.id));

  revalidatePath(`/admin/plans/workouts/${current.workoutId}`);
}
