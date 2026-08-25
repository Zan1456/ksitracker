"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { IconDumbbell, IconTrophy, IconUser, IconUsers, IconClipboard, IconChart } from "./icons";
import { ComponentType, SVGProps } from "react";

type Item = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; exact?: boolean };

const userItems: Item[] = [
  { href: "/", label: "Edzések", icon: IconDumbbell, exact: true },
  { href: "/leaderboard", label: "Ranglista", icon: IconTrophy },
  { href: "/profile", label: "Profil", icon: IconUser },
];

const adminItems: Item[] = [
  { href: "/admin", label: "Felhasználók", icon: IconUsers, exact: true },
  { href: "/admin/plans", label: "Edzéstervek", icon: IconClipboard },
  { href: "/admin/stats", label: "Statisztika", icon: IconChart },
];

export function BottomNav({ variant = "user" }: { variant?: "user" | "admin" }) {
  const pathname = usePathname();
  const items = variant === "admin" ? adminItems : userItems;
  const layoutGroup = variant === "admin" ? "admin-nav" : "user-nav";

  return (
    <nav className="glass sticky bottom-0 z-10 mt-auto flex border-t">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center gap-1.5 py-3 pb-4 text-center text-[10.5px] font-medium"
          >
            {active && (
              <motion.div
                layoutId={layoutGroup}
                className="absolute inset-x-2.5 top-0.5 h-[2px] rounded-full bg-text"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className={cn("transition-colors", active ? "text-text" : "text-text-faint")}>
              <Icon width={17} height={17} strokeWidth={active ? 2 : 1.6} />
            </span>
            <span className={cn("transition-colors", active ? "text-text" : "text-text-faint")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
