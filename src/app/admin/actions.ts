"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { todayIso } from "@/lib/format";

export async function toggleBanAction(userId: string, ban: boolean) {
  await requireAdmin();
  await db.update(users).set({ isBanned: ban }).where(eq(users.id, userId));
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${userId}`);
}

export async function resetDailyLimitAction(userId: string) {
  await requireAdmin();
  await db.update(users).set({ dailyBonusDate: todayIso() }).where(eq(users.id, userId));
  revalidatePath(`/admin/users/${userId}`);
}
