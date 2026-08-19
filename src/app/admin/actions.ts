"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, workoutSessions } from "@/db/schema";
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

const createUserSchema = z.object({
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen."),
  email: z.string().trim().email("Adj meg egy érvényes e-mail címet."),
  password: z.string().min(8, "A jelszó legalább 8 karakter legyen."),
  role: z.enum(["user", "admin"]),
});

export type AdminFormState = { error?: string; success?: boolean } | undefined;

export async function createUserAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const { name, email, password, role } = parsed.data;
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "Ezzel az e-mail címmel már regisztráltak." };

  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db.insert(users).values({ name, email, passwordHash, role }).returning();

  revalidatePath("/admin");
  redirect(`/admin/users/${created.id}`);
}

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen."),
  email: z.string().trim().email("Adj meg egy érvényes e-mail címet."),
  role: z.enum(["user", "admin"]),
});

export async function updateUserAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const { userId, name, email, role } = parsed.data;
  const [emailTaken] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, userId)))
    .limit(1);
  if (emailTaken) return { error: "Ezzel az e-mail címmel már regisztráltak." };

  await db.update(users).set({ name, email, role }).where(eq(users.id, userId));
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8, "A jelszó legalább 8 karakter legyen."),
});

export async function resetPasswordAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = resetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, parsed.data.userId));
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return; // can't delete yourself
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteSessionAction(userId: string, sessionId: string) {
  await requireAdmin();
  await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));
  revalidatePath(`/admin/users/${userId}`);
}
