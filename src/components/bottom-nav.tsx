"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { navItems, type NavVariant } from "@/lib/nav-items";
import { IconLogout } from "@/components/icons";
import { signOutAction } from "@/lib/auth-actions";

export function BottomNav({ variant = "user" }: { variant?: NavVariant }) {
  const pathname = usePathname();
  const items = navItems[variant];
  const layoutGroup = variant === "admin" ? "admin-nav" : "user-nav";

  return (
    <nav className="glass sticky bottom-0 z-10 mt-auto flex border-t xl:hidden">
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

      {variant === "admin" && (
        <form action={signOutAction} className="flex flex-1">
          <button
            type="submit"
            className="flex flex-1 flex-col items-center gap-1.5 py-3 pb-4 text-center text-[10.5px] font-medium text-text-faint"
          >
            <IconLogout width={17} height={17} strokeWidth={1.6} />
            Kilépés
          </button>
        </form>
      )}
    </nav>
  );
}
