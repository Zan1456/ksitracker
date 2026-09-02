"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app-shell";
import { loginAction } from "./actions";

const WEEKDAY_LABELS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-7 py-10">
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

        <div className="mt-7 flex flex-col gap-3.5 rounded-[12px] border border-border bg-bg-inset p-5">
          <div className="mono text-[10.5px] tracking-[0.08em] text-text-faint">HETI RITMUS</div>
          <div className="mono text-[38px] font-light leading-none tracking-[-0.03em]">
            3<span className="ml-2.5 text-[13px] text-text-faint">SZINT, EGYRE NEHEZEBB EDZÉSEKKEL</span>
          </div>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="flex-1 text-center">
                <div className="mono mb-1.75 text-[9.5px] text-text-faint">{label}</div>
                <div className="h-8 rounded-[7px] border border-success-border bg-success-bg" />
              </div>
            ))}
          </div>
          <p className="text-[12.5px] leading-[1.5] text-text-muted">
            Napi egy edzés, három szint, mért idők. A ranglista feladatonként mutatja a legjobb köröket.
          </p>
        </div>

        <p className="mt-7 text-[13px] text-text-muted">
          Nincs még fiókod?{" "}
          <Link href="/register" className="border-b border-border-strong text-text">
            Regisztráció
          </Link>
        </p>
      </div>
    </div>
  );
}
