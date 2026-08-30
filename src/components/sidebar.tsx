"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { navItems, type NavVariant } from "@/lib/nav-items";
import { BrandMark } from "@/components/brand-mark";
import { IconLogout } from "@/components/icons";
import { signOutAction } from "@/lib/auth-actions";

/**
 * Real-desktop-only counterpart to `BottomNav`: a persistent left rail
 * instead of a bottom bar. Shows at `xl+` (the tablet band in between uses
 * `TopTabs` instead) — all three stay mounted rather than swapping
 * components at the breakpoint, so navigation never flashes/reflows while
 * the layout settles.
 */
export function Sidebar({ variant = "user" }: { variant?: NavVariant }) {
  const pathname = usePathname();
  const items = navItems[variant];
  const layoutGroup = variant === "admin" ? "admin-sidebar-nav" : "user-sidebar-nav";

  return (
    <aside className="glass sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-1 border-r px-3 py-5 xl:flex">
      <div className="mb-6 px-2.5">
        <BrandMark />
        {variant === "admin" && (
          <span className="mono mt-2 inline-block rounded-[5px] border border-border-strong px-1.5 py-1 text-[10px] text-text-secondary">
            ADMIN
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-[13px] font-medium"
            >
              {active && (
                <motion.div
                  layoutId={layoutGroup}
                  className="absolute inset-0 rounded-[9px] bg-bg-inset"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex shrink-0 items-center transition-colors",
                  active ? "text-text" : "text-text-faint"
                )}
              >
                <Icon width={17} height={17} strokeWidth={active ? 2 : 1.6} />
              </span>
              <span className={cn("relative z-10 transition-colors", active ? "text-text" : "text-text-muted")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <form action={signOutAction} className="mt-auto pt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-[13px] font-medium text-text-faint transition-colors hover:text-danger"
        >
          <IconLogout width={17} height={17} strokeWidth={1.6} />
          Kijelentkezés
        </button>
      </form>
    </aside>
  );
}
