import { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col border-border md:border-x">
      {children}
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
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-2">
        {eyebrow}
        <h1 className="text-[17px] font-medium tracking-[-0.02em]">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3.5 w-3.5 rotate-45 rounded-[3px] bg-text" />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">Repline</span>
    </div>
  );
}
