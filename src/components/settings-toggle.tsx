"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import type { UserSettings } from "@/lib/user-settings";
import { updateUserSettingAction } from "@/app/profile/actions";

export function SettingsToggle({
  settingKey,
  name,
  sub,
  initialValue,
}: {
  settingKey: keyof UserSettings;
  name: string;
  sub: string;
  initialValue: boolean;
}) {
  const [on, setOn] = useState(initialValue);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(() => updateUserSettingAction(settingKey, next));
      }}
      className="flex w-full items-center gap-3 border-b border-white/8 px-4.5 py-4 text-left last:border-b-0"
    >
      <span className="flex-1">
        <span className="block text-[13.5px] font-bold">{name}</span>
        <span className="mt-1.5 block text-[11px] font-medium text-white/55">{sub}</span>
      </span>
      <span
        className={cn(
          "flex h-6.75 w-11.5 shrink-0 items-center rounded-full p-0.75 transition-colors",
          on ? "bg-accent justify-end" : "bg-white/22 justify-start"
        )}
      >
        <span className={cn("h-5.25 w-5.25 rounded-full", on ? "bg-[#0A0A0B]" : "bg-white")} />
      </span>
    </button>
  );
}
