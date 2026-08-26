"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatHMS } from "@/lib/format";

/** Amber "you've already trained today" banner with a live H:MM:SS countdown to the next day. */
export function DailyLimitCountdownBanner({ initialMs }: { initialMs: number }) {
  const [ms, setMs] = useState(initialMs);

  useEffect(() => {
    const interval = setInterval(() => setMs((prev) => Math.max(0, prev - 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.75 rounded-[9px] border border-warning-border bg-warning-bg px-3.25 py-3">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
      <div className="flex-1 text-[12.5px] leading-[1.4] text-warning">
        Ma már edzettél. Új edzés{" "}
        <span className="mono font-medium text-text">{formatHMS(ms / 1000)}</span> múlva indítható.
      </div>
    </div>
  );
}

/** Amber "you have a session in progress" banner linking back to the live session. */
export function InProgressBanner({ href, label = "Folyamatban lévő edzésed van." }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.75 rounded-[9px] border border-warning-border bg-warning-bg px-3.25 py-3"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
      <div className="flex-1 text-[12.5px] leading-[1.4] text-warning">
        {label} <span className="font-medium text-text">Folytatás →</span>
      </div>
    </Link>
  );
}
