import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
  const valid = !!user && !!user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt > new Date();

  return (
    <AppShell background="deep">
      <div className="animate-rise flex flex-1 flex-col justify-center gap-5 px-6.5">
        <h1 className="text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em]">
          új
          <br />
          jelszó
        </h1>

        {valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <>
            <p className="m-0 text-[14px] leading-[1.5] font-medium text-white/72">
              A link érvénytelen vagy már lejárt. Kérj egy újat.
            </p>
            <Link href="/forgot-password">
              <Button size="lg" className="w-full">
                Új link kérése
              </Button>
            </Link>
          </>
        )}
      </div>
    </AppShell>
  );
}
