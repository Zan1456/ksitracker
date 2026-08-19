"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/auth";

const schema = z.object({
  name: z.string().trim().min(2, "A név legalább 2 karakter legyen."),
  email: z.string().trim().email("Adj meg egy érvényes e-mail címet."),
  password: z.string().min(8, "A jelszó legalább 8 karakter legyen."),
});

export type RegisterState = { error?: string } | undefined;

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Hibás adatok." };
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "Ezzel az e-mail címmel már regisztráltak." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash, role: "user" });

  await signIn("credentials", { email, password, redirectTo: "/" });
}
