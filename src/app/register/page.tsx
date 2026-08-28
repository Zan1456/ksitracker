"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app-shell";
import { registerAction } from "./actions";

const WEEKDAY_LABELS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <div className="flex min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-7 py-10 lg:mx-0 lg:max-w-none lg:flex-none lg:basis-1/2 lg:px-24 xl:px-32">
        <div className="mb-9">
          <BrandMark />
        </div>
        <h1 className="mb-1.5 text-[27px] font-medium leading-[1.15] tracking-[-0.03em]">
          Regisztráció
        </h1>
        <p className="mb-7 text-sm text-text-muted">Kezdd el a szintenkénti edzésterved.</p>

        <form action={formAction} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <Label>Név</Label>
            <Input type="text" name="name" placeholder="Kovács Anna" required autoComplete="name" />
          </label>
          <label className="flex flex-col gap-1.5">
            <Label>E-mail</Label>
            <Input type="email" name="email" placeholder="nev@email.hu" required autoComplete="email" />
          </label>
          <label className="flex flex-col gap-1.5">
            <Label>Jelszó</Label>
            <Input type="password" name="password" required minLength={8} autoComplete="new-password" />
          </label>

          {state?.error && (
            <p className="rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-[12.5px] text-danger">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-1">
            {pending ? "Fiók létrehozása…" : "Fiók létrehozása"}
          </Button>
        </form>

        <p className="mt-7 text-[13px] text-text-muted">
          Van már fiókod?{" "}
          <Link href="/login" className="border-b border-border-strong text-text">
            Bejelentkezés
          </Link>
        </p>
      </div>

      {/* Desktop-only marketing panel — the mobile/tablet layout above is the whole page below `lg`. */}
      <div className="hidden flex-1 flex-col justify-center gap-7 border-l border-border bg-bg-inset px-20 lg:flex">
        <div className="mono text-[10.5px] tracking-[0.08em] text-text-faint">HETI RITMUS</div>
        <div>
          <div className="mono text-[52px] font-light leading-none tracking-[-0.03em]">
            3<span className="ml-3 text-[18px] text-text-faint">SZINT, EGYRE NEHEZEBB EDZÉSEKKEL</span>
          </div>
        </div>
        <div className="flex max-w-[420px] gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="flex-1 text-center">
              <div className="mono mb-2 text-[10px] text-text-faint">{label}</div>
              <div className="h-11 rounded-lg border border-border-strong bg-bg-elevated" />
            </div>
          ))}
        </div>
        <p className="max-w-[320px] text-[13.5px] leading-[1.6] text-text-muted">
          Napi egy edzés, három szint, mért idők. A ranglista feladatonként mutatja a legjobb köröket.
        </p>
      </div>
    </div>
  );
}
