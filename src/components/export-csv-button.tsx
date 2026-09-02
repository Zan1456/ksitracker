"use client";

import { useTransition } from "react";
import { toast } from "@/lib/toast-store";
import { exportHistoryCsvAction } from "@/app/profile/actions";

export function ExportCsvButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const csv = await exportHistoryCsvAction();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "repline-edzesnaplo.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Edzésnapló exportálva.", "success");
    });
  }

  return (
    <button onClick={handleExport} disabled={isPending} className={className}>
      {isPending ? "Exportálás…" : "Adatok exportja"}
    </button>
  );
}
