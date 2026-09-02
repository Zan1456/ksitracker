"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { navItems, type NavVariant } from "@/lib/nav-items";

/**
 * Floating glass pill, icon-only, fixed above the page rather than sitting
 * in normal flow — matches the Repline design exactly. Because it floats,
 * scrollable page content needs its own bottom spacer (~96px) so the last
 * row isn't hidden under it; see the `pb-24` (or an explicit spacer div) on
 * each page's scroll container.
 */
export function BottomNav({ variant = "user" }: { variant?: NavVariant }) {
  const pathname = usePathname();
  const items = navItems[variant];

  return (
    <nav
      className="glass fixed inset-x-0 bottom-[22px] z-30 mx-auto flex w-[calc(100%-36px)] max-w-[calc(520px-36px)] gap-1.5 rounded-full border p-1.5"
      aria-label={variant === "admin" ? "Admin navigáció" : "Navigáció"}
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "flex flex-1 items-center justify-center rounded-full py-3.5 transition-colors",
              active ? "bg-white text-brand-blue" : "text-white"
            )}
          >
            <Icon width={21} height={21} strokeWidth={1.9} />
          </Link>
        );
      })}
    </nav>
  );
}
