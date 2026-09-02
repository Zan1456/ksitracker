"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@/components/icons";
import { requestPasswordResetAction } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <div className="animate-rise flex flex-1 flex-col justify-center gap-5 px-6.5">
      <Link
        href="/login"
        aria-label="Vissza a bejelentkezéshez"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16"
      >
        <IconArrowLeft width={17} height={17} strokeWidth={2} />
      </Link>
      <h1 className="text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em]">
        jelszó
        <br />
        helyreállítás
      </h1>

      {state?.sent ? (
        <p className="m-0 text-[14px] leading-[1.5] font-medium text-white/72">
          Ha ezzel az e-mail-címmel van fiókod, elküldtük rá a helyreállító linket.
        </p>
      ) : (
        <>
          <p className="m-0 text-[14px] leading-[1.5] font-medium text-white/72">
            Elküldjük a helyreállító linket az e-mail-címedre.
          </p>
          <form action={formAction} className="flex flex-col gap-2.75">
            <Input type="email" name="email" placeholder="E-mail" required autoComplete="email" />
            {state?.error && (
              <p className="rounded-2xl border border-danger-border bg-danger-bg px-4.5 py-3.25 text-[12.5px] font-semibold leading-[1.4] text-danger">
                {state.error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={pending} className="w-full">
              {pending ? "Küldés…" : "Link küldése"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
