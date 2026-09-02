"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getHistory } from "@/lib/workout-data";
import { formatSeconds } from "@/lib/format";
import type { UserSettings } from "@/lib/user-settings";

export async function updateUserSettingAction(key: keyof UserSettings, value: boolean) {
  const user = await requireUser();
  await db
    .update(users)
    .set({ [key]: value })
    .where(eq(users.id, user.id));
  revalidatePath("/profile");
}

/** CSV of the user's own session history — no third-party dependency needed. */
export async function exportHistoryCsvAction(): Promise<string> {
  const user = await requireUser();
  const history = await getHistory(user.id, 1000);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Dátum", "Edzés", "Szint", "Teljes idő"].map(escape).join(",");
  const rows = history.map((h) =>
    [h.sessionDate, h.workoutName, String(h.levelIndex), h.totalSeconds != null ? formatSeconds(h.totalSeconds) : ""]
      .map(escape)
      .join(",")
  );
  return [header, ...rows].join("\n");
}
