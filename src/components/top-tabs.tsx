"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { navItems, type NavVariant } from "@/lib/nav-items";
import { IconLogout } from "@/components/icons";
import { signOutAction } from "@/lib/auth-actions";

/**
 * Tablet-band counterpart to `Sidebar`/`BottomNav`: a row of pill tabs
 * instead of a rail or a bottom bar. Visible only `md`–`<xl` (real desktop
 * gets `Sidebar`, phone gets `BottomNav`) — each page mounts this inside its
 * own tablet header, next to whatever page-specific chrome (title, avatar,
 * back link) it already renders there.
 */
export function TopTabs({ variant = "user" }: { variant?: NavVariant }) {
  const pathname = usePathname();
  const items = navItems[variant];
  const layoutGroup = variant === "admin" ? "admin-toptabs-nav" : "user-toptabs-nav";

  return (
    <nav className="flex gap-2">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative rounded-[9px] px-3.75 py-2.25 text-[13px] font-medium",
              active ? "text-text" : "text-text-muted"
            )}
          >
            {active && (
              <motion.div
                layoutId={layoutGroup}
                className="absolute inset-0 rounded-[9px] border border-border-strong bg-bg-inset"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}

      {variant === "admin" && (
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.75 rounded-[9px] px-3.75 py-2.25 text-[13px] font-medium text-text-faint"
          >
            <IconLogout width={15} height={15} strokeWidth={1.6} />
            Kilépés
          </button>
        </form>
      )}
    </nav>
  );
}
