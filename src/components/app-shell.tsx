import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/cn";
import type { NavVariant } from "@/lib/nav-items";

export { BrandMark } from "@/components/brand-mark";

/**
 * On mobile this is just the familiar single "phone card" column. At `md+`
 * it grows into a real desktop layout: a persistent sidebar rail (when `nav`
 * is given) plus a wider content column, instead of the phone card sitting
 * letterboxed in the middle of the screen.
 *
 * `wide` lifts the column's cap further at `xl+`, for pages with a bespoke
 * multi-column desktop layout of their own (e.g. the homepage's hero +
 * summary rail) instead of just a stretched single column.
 */
export function AppShell({
  children,
  nav,
  wide,
}: {
  children: ReactNode;
  nav?: NavVariant;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen w-full justify-center">
      {nav && <Sidebar variant={nav} />}
      <div
        className={cn(
          "flex w-full max-w-[520px] flex-1 flex-col border-border md:max-w-[640px]",
          wide && "xl:max-w-[1180px]",
          nav ? "md:border-r" : "md:border-x"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AppHeader({
  title,
  right,
  eyebrow,
}: {
  title: ReactNode;
  right?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="glass sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-4">
      <div className="flex items-center gap-2">
        {eyebrow}
        <h1 className="text-[17px] font-medium tracking-[-0.02em]">{title}</h1>
      </div>
      {right}
    </div>
  );
}
