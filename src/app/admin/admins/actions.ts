"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, type AdminPermissions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";

const roleEnum = z.enum(["primary", "admin"]);

const createSchema = z.object({
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen."),
  email: z.string().trim().email("Adj meg egy érvényes e-mail címet."),
  password: z.string().min(8, "A jelszó legalább 8 karakter legyen."),
  role: roleEnum,
  perms: z.record(z.string(), z.boolean()).optional(),
});

export type AdminEditState = { error?: string; success?: boolean } | undefined;

function permsFromForm(formData: FormData): AdminPermissions {
  return {
    users: formData.get("perm_users") === "on",
    workouts: formData.get("perm_workouts") === "on",
    stats: formData.get("perm_stats") === "on",
    admins: formData.get("perm_admins") === "on",
  };
}

export async function createAdminAction(_prev: AdminEditState, formData: FormData): Promise<AdminEditState> {
  await requireAdmin("admins");

  const parsed = createSchema.safeParse({
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
  const adminPermissions = role === "primary" ? null : permsFromForm(formData);

  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: "admin", adminPermissions })
    .returning();

  revalidatePath("/admin/admins");
  redirect(`/admin/admins/${created.id}`);
}

const updateSchema = z.object({
  adminId: z.string().uuid(),
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen."),
  email: z.string().trim().email("Adj meg egy érvényes e-mail címet."),
  role: roleEnum,
});

export async function updateAdminAction(_prev: AdminEditState, formData: FormData): Promise<AdminEditState> {
  await requireAdmin("admins");

  const parsed = updateSchema.safeParse({
    adminId: formData.get("adminId"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };

  const { adminId, name, email, role } = parsed.data;
  const [emailTaken] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, adminId)))
    .limit(1);
  if (emailTaken) return { error: "Ezzel az e-mail címmel már regisztráltak." };

  const adminPermissions = role === "primary" ? null : permsFromForm(formData);
  await db.update(users).set({ name, email, adminPermissions }).where(eq(users.id, adminId));

  revalidatePath("/admin/admins");
  revalidatePath(`/admin/admins/${adminId}`);
  return { success: true };
}

export async function deleteAdminAction(adminId: string) {
  const me = await requireAdmin("admins");
  if (me.id === adminId) return; // can't delete your own account
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  if (admins.length <= 1) return; // at least one admin must remain
  await db.delete(users).where(eq(users.id, adminId));
  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}
