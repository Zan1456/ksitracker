"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app-shell";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-7 py-10">
      <div className="mb-9">
        <BrandMark />
      </div>
      <h1 className="mb-1.5 text-[27px] font-medium leading-[1.15] tracking-[-0.03em]">
        Bejelentkezés
      </h1>
      <p className="mb-7 text-sm text-text-muted">Folytasd ott, ahol abbahagytad.</p>

      <form action={formAction} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <Label>E-mail</Label>
          <Input type="email" name="email" placeholder="nev@email.hu" required autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1.5">
          <Label>Jelszó</Label>
          <Input type="password" name="password" required autoComplete="current-password" minLength={8} />
        </label>

        {state?.error && (
          <p className="rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-[12.5px] text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="mt-1">
          {pending ? "Belépés…" : "Belépés"}
        </Button>
      </form>

      <p className="mt-7 text-[13px] text-text-muted">
        Nincs még fiókod?{" "}
        <Link href="/register" className="border-b border-border-strong text-text">
          Regisztráció
        </Link>
      </p>
    </div>
  );
}
