import { ReactNode } from "react";
import { screenBackground, type ScreenBackgroundKind } from "@/lib/screen-background";

export { BrandMark } from "@/components/brand-mark";

/**
 * Single phone-width column — this app is phone-only, no tablet/desktop
 * layout. `background` picks one of the three Repline screen gradients
 * (see `screenBackground()`); defaults to the standard blue wash used by
 * most screens.
 */
export function AppShell({
  children,
  background = "default",
}: {
  children: ReactNode;
  background?: ScreenBackgroundKind;
}) {
  return (
    <div className="flex min-h-screen w-full justify-center" style={{ background: screenBackground(background) }}>
      <div className="flex w-full max-w-[520px] flex-1 flex-col text-text">{children}</div>
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
