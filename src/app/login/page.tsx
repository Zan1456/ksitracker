"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <AppShell background="hero">
      <div className="animate-rise flex flex-1 flex-col justify-end gap-5.5 px-6.5 pb-8.5">
        <div>
          <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em]">
            üdv
            <br />a klubban!
          </h1>
          <p className="mt-3.5 max-w-[290px] text-[14.5px] leading-[1.5] font-medium text-white/75">
            Szintek, sorban teljesítendő edzések, szintzáró kihívás. Folytasd ott, ahol abbahagytad.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-2.75">
          <Input type="email" name="email" placeholder="E-mail" required autoComplete="email" />
          <Input
            type="password"
            name="password"
            placeholder="Jelszó"
            required
            autoComplete="current-password"
            minLength={8}
          />

          {state?.error && (
            <p className="rounded-2xl border border-danger-border bg-danger-bg px-4.5 py-3.25 text-[12.5px] font-semibold leading-[1.4] text-danger">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            {pending ? "Belépés…" : "Belépés"}
          </Button>

          <div className="flex items-center justify-between px-2 pt-0.5">
            <Link href="/forgot-password" className="text-[12.5px] font-semibold text-white/70">
              Elfelejtett jelszó
            </Link>
            <Link href="/register" className="text-[12.5px] font-bold text-accent">
              Új fiók
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
