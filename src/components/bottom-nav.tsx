"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <nav className="sticky bottom-0 mt-auto flex border-t border-border bg-bg-inset">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 py-3 pb-4 text-center text-[10.5px] font-medium transition-colors",
              active ? "text-text" : "text-text-faint hover:text-text-muted"
            )}
          >
            <Icon width={17} height={17} strokeWidth={active ? 2 : 1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
