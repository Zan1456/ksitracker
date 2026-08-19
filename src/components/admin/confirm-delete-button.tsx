"use client";

import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast-store";
import { IconX } from "@/components/icons";

export function ConfirmDeleteButton({
  confirmText,
  toastText,
  action,
  className,
  label,
}: {
  confirmText: string;
  toastText?: string;
  action: () => Promise<void> | void;
  className?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(confirmText)) return;
        if (toastText) toast(toastText, "info");
        startTransition(() => action());
      }}
      className={cn(
        "flex items-center gap-1.5 text-text-faint hover:text-danger disabled:opacity-40",
        className
      )}
    >
      <IconX width={12} height={12} />
      {label}
    </button>
  );
}
