"use client";

import { useState } from "react";
import Link from "next/link";

const TIPS: [string, string][] = [
  ["Sorban haladj", "Egy szint edzései egymásra épülnek: a következő csak az előző teljesítése után nyílik meg."],
  ["A kihívás számít", "Csak a szintzáró kihívásban választott feladatok idői kerülnek a ranglistára."],
  ["Pihenj tudatosan", "A feladatok közti pihenő tartja a tempót — az edzés közben ki is hagyható."],
  ["A forma előbb, mint a tempó", "Az időre menő feladatoknál is a technika dönt."],
];

/** Rotating tip card on the home screen — purely local UI state, no persistence needed. */
export function HomeTipCard() {
  const [i, setI] = useState(0);
  const [title, body] = TIPS[i % TIPS.length];

  return (
    <div className="rounded-[26px] bg-accent p-5.5 text-[#0A0A0B]">
      <div className="text-[25px] font-extrabold leading-[1.1] tracking-[-0.03em]">{title}</div>
      <p className="m-0 mt-2.5 mb-4 text-[13px] font-semibold leading-[1.45] text-black/72">{body}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setI((n) => n + 1)}
          className="rounded-full bg-[#0A0A0B] px-5 py-3.25 text-[13px] font-bold text-white"
        >
          Következő tipp
        </button>
        <Link
          href="/leaderboard"
          className="rounded-full border border-black/25 px-5 py-3.25 text-[13px] font-bold text-[#0A0A0B]"
        >
          Ranglista
        </Link>
      </div>
    </div>
  );
}
