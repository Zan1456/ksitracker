"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2.75">
      <input type="hidden" name="token" value={token} />
      <Input
        type="password"
        name="password"
        placeholder="Új jelszó (min. 8 karakter)"
        required
        minLength={8}
        autoComplete="new-password"
      />
      {state?.error && (
        <p className="rounded-2xl border border-danger-border bg-danger-bg px-4.5 py-3.25 text-[12.5px] font-semibold leading-[1.4] text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Mentés…" : "Jelszó mentése"}
      </Button>
    </form>
  );
}
