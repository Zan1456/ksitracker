"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CategorySelect({
  categories,
  selected,
}: {
  categories: { name: string }[];
  selected: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(name: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cat", name);
    router.push(`/leaderboard?${params.toString()}`);
  }

  return (
    <div className="relative flex items-center justify-between rounded-[9px] border border-border-strong bg-bg-inset px-3.25 py-3">
      <div>
        <div className="mono mb-1.5 text-[10px] text-text-faint">FELADAT</div>
        <div className="text-[13.5px] font-medium">{selected}</div>
      </div>
      <span className="text-[13px] text-text-muted">⌄</span>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Feladat kiválasztása"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {categories.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
