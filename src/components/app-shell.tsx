import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/cn";
import type { NavVariant } from "@/lib/nav-items";

export { BrandMark } from "@/components/brand-mark";

/**
 * Three layers in one tree (no component swap at the breakpoint, so nothing
 * flashes/reflows while the layout settles):
 * - `<md` (telefon): the familiar single "phone card" column, `BottomNav`.
 * - `md`–`<xl` (tablet): a wider column with `TopTabs` inside each page's
 *   own header, no side rail.
 * - `xl+` (gép): the persistent `Sidebar` rail (when `nav` is given) next to
 *   the content column.
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
          nav ? "xl:border-r" : "xl:border-x"
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
