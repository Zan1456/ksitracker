"use server";

import { z } from "zod";
import { asc, eq, gt, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { challengeTasks, challengeSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { getOrCreateChallengeSettings } from "@/lib/challenge-data";

export type PlanFormState = { error?: string; success?: boolean } | undefined;

const challengeTaskSchema = z.object({
  name: z.string().trim().min(1, "Adj meg egy nevet."),
  note: z.string().trim().optional(),
  targetDistanceMeters: z.coerce.number().int().min(1).optional(),
  rankDirection: z.enum(["asc", "desc"]),
  resultKind: z.enum(["time", "reps"]),
});

function challengeTaskFormToValues(formData: FormData) {
  return {
    name: formData.get("name"),
    note: formData.get("note") || undefined,
    targetDistanceMeters: formData.get("targetDistanceMeters") || undefined,
    rankDirection: formData.get("rankDirection"),
    resultKind: formData.get("resultKind"),
  };
}

export async function createChallengeTaskAction(
  _prev: PlanFormState,
  formData: FormData
): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const parsed = challengeTaskSchema.safeParse(challengeTaskFormToValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const siblings = await db.select().from(challengeTasks);
  const nextOrder = siblings.reduce((max, t) => Math.max(max, t.order), -1) + 1;

  await db.insert(challengeTasks).values({
    order: nextOrder,
    name: parsed.data.name,
    note: parsed.data.note || null,
    targetDistanceMeters: parsed.data.targetDistanceMeters ?? null,
    rankDirection: parsed.data.rankDirection,
    resultKind: parsed.data.resultKind,
  });

  revalidatePath("/admin/plans/challenge");
  return { success: true };
}

export async function updateChallengeTaskAction(
  _prev: PlanFormState,
  formData: FormData
): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const taskId = formData.get("taskId") as string;
  const parsed = challengeTaskSchema.safeParse(challengeTaskFormToValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  await db
    .update(challengeTasks)
    .set({
      name: parsed.data.name,
      note: parsed.data.note || null,
      targetDistanceMeters: parsed.data.targetDistanceMeters ?? null,
      rankDirection: parsed.data.rankDirection,
      resultKind: parsed.data.resultKind,
    })
    .where(eq(challengeTasks.id, taskId));

  revalidatePath("/admin/plans/challenge");
  return { success: true };
}

export async function deleteChallengeTaskAction(taskId: string) {
  await requireAdmin("workouts");
  await db.delete(challengeTasks).where(eq(challengeTasks.id, taskId));
  revalidatePath("/admin/plans/challenge");
}

export async function reorderChallengeTaskAction(taskId: string, direction: "up" | "down") {
  await requireAdmin("workouts");
  const [current] = await db.select().from(challengeTasks).where(eq(challengeTasks.id, taskId)).limit(1);
  if (!current) return;

  const [neighbor] =
    direction === "up"
      ? await db
          .select()
          .from(challengeTasks)
          .where(lt(challengeTasks.order, current.order))
          .orderBy(asc(challengeTasks.order))
          .limit(1)
      : await db
          .select()
          .from(challengeTasks)
          .where(gt(challengeTasks.order, current.order))
          .orderBy(asc(challengeTasks.order))
          .limit(1);
  if (!neighbor) return;

  await db.update(challengeTasks).set({ order: -1 }).where(eq(challengeTasks.id, current.id));
  await db.update(challengeTasks).set({ order: current.order }).where(eq(challengeTasks.id, neighbor.id));
  await db.update(challengeTasks).set({ order: neighbor.order }).where(eq(challengeTasks.id, current.id));

  revalidatePath("/admin/plans/challenge");
}

const settingsSchema = z.object({
  minRequired: z.coerce.number().int().min(1),
});

export async function updateChallengeSettingsAction(
  _prev: PlanFormState,
  formData: FormData
): Promise<PlanFormState> {
  await requireAdmin("workouts");
  const parsed = settingsSchema.safeParse({ minRequired: formData.get("minRequired") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const settings = await getOrCreateChallengeSettings();
  await db
    .update(challengeSettings)
    .set({ minRequired: parsed.data.minRequired })
    .where(eq(challengeSettings.id, settings.id));

  revalidatePath("/admin/plans/challenge");
  return { success: true };
}
