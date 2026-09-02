"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "A jelszó legalább 8 karakter legyen."),
});

export type ResetPasswordState = { error?: string } | undefined;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };
  }

  const { token, password } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);

  if (!user || !user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt < new Date()) {
    return { error: "A link érvénytelen vagy lejárt. Kérj újat." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .update(users)
    .set({ passwordHash, passwordResetToken: null, passwordResetTokenExpiresAt: null })
    .where(eq(users.id, user.id));

  redirect("/login");
}
