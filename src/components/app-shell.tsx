import { ReactNode } from "react";

export { BrandMark } from "@/components/brand-mark";

/**
 * Single phone-width column — this app is phone-only, no tablet/desktop
 * layout.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full justify-center">
      <div className="flex w-full max-w-[520px] flex-1 flex-col border-x border-border">
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
