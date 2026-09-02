"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const schema = z.object({
  email: z.string().trim().email("Adj meg egy érvényes e-mail címet."),
});

export type ForgotPasswordState = { error?: string; sent?: boolean } | undefined;

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };
  }

  const { email } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always report success either way — don't let this endpoint reveal
  // whether an email address has an account.
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      })
      .where(eq(users.id, user.id));

    // No email provider is wired up yet — until one is, the reset link is
    // only reachable via the server log, not actually delivered to the
    // user. Whoever owns the deploy can hand it over manually in the
    // meantime.
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    console.log(`[password-reset] ${email} → ${base}/reset-password/${token}`);
  }

  return { sent: true };
}
