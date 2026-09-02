import { ReactNode } from "react";
import { screenBackground, type ScreenBackgroundKind } from "@/lib/screen-background";
import { auth } from "@/auth";
import { isInUserView, exitUserViewAction } from "@/lib/admin-user-view";

export { BrandMark } from "@/components/brand-mark";

/**
 * Single phone-width column — this app is phone-only, no tablet/desktop
 * layout. `background` picks one of the three Repline screen gradients
 * (see `screenBackground()`); defaults to the standard blue wash used by
 * most screens. Also carries the floating "ADMIN NÉZET ← vissza" pill
 * whenever an admin is previewing the member app (see
 * `src/lib/admin-user-view.ts`) — it's a no-op, harmless to show on an
 * actual admin page too, so this doesn't bother checking the route.
 */
export async function AppShell({
  children,
  background = "default",
}: {
  children: ReactNode;
  background?: ScreenBackgroundKind;
}) {
  const session = await auth();
  const showExitPill = session?.user?.role === "admin" && (await isInUserView());

  return (
    <div className="flex min-h-screen w-full justify-center" style={{ background: screenBackground(background) }}>
      <div className="relative flex w-full max-w-[520px] flex-1 flex-col text-text">
        {showExitPill && (
          <form action={exitUserViewAction} className="absolute left-1/2 top-13 z-40 -translate-x-1/2">
            <button
              type="submit"
              className="whitespace-nowrap rounded-full bg-accent px-4 py-2.5 text-[11.5px] font-extrabold text-accent-fg shadow-[0_8px_20px_rgba(0,0,0,.3)]"
            >
              ADMIN NÉZET ← vissza
            </button>
          </form>
        )}
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
