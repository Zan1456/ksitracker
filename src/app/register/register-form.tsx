"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@/components/icons";
import { registerAction } from "./actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <div className="animate-rise flex flex-1 flex-col gap-4.5 px-6.5 pb-8.5">
      <Link
        href="/login"
        aria-label="Vissza a bejelentkezéshez"
        className="mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/16"
      >
        <IconArrowLeft width={17} height={17} strokeWidth={2} />
      </Link>

      <div className="flex flex-1 flex-col justify-end gap-4.5">
        <h1 className="text-[38px] font-extrabold leading-[1.04] tracking-[-0.03em]">
          csatlakozz
          <br />a klubhoz
        </h1>

        <form action={formAction} className="flex flex-col gap-2.75">
          <Input type="text" name="name" placeholder="Név" required autoComplete="name" />
          <Input type="email" name="email" placeholder="E-mail" required autoComplete="email" />
          <Input
            type="password"
            name="password"
            placeholder="Jelszó (min. 8 karakter)"
            required
            minLength={8}
            autoComplete="new-password"
          />

          {state?.error && (
            <p className="rounded-2xl border border-danger-border bg-danger-bg px-4.5 py-3.25 text-[12.5px] font-semibold leading-[1.4] text-danger">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            {pending ? "Fiók létrehozása…" : "Tovább"}
          </Button>
        </form>
      </div>
    </div>
  );
}
