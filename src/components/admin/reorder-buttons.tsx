"use client";

import { useTransition } from "react";
import { cn } from "@/lib/cn";

export function ReorderButtons({
  disabledUp,
  disabledDown,
  onUp,
  onDown,
}: {
  disabledUp?: boolean;
  disabledDown?: boolean;
  onUp: () => Promise<void> | void;
  onDown: () => Promise<void> | void;
}) {
  const [isPending, startTransition] = useTransition();

  const btnClass =
    "flex h-6 w-6 items-center justify-center rounded-[5px] border border-border-strong text-[11px] text-text-secondary disabled:opacity-30";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={disabledUp || isPending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startTransition(() => onUp());
        }}
        className={cn(btnClass)}
        aria-label="Feljebb"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={disabledDown || isPending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startTransition(() => onDown());
        }}
        className={cn(btnClass)}
        aria-label="Lejjebb"
      >
        ↓
      </button>
    </div>
  );
}
