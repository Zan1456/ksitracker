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
    <div className="flex h-full w-full justify-center" style={{ background: screenBackground(background) }}>
      {/* `min-h-0` matters here: without it, a flex child defaults to
          `min-height: auto` (its content size), so a page's own
          `flex-1 overflow-y-auto` region downstream never actually gets
          bounded by the viewport — it just grows, and the whole document
          scrolls instead (see the `overflow: hidden` note on html/body in
          globals.css). The `overflow-y-auto` here is a fallback for the few
          screens (login/register/...) that render straight into AppShell
          without their own scroll container. */}
      <div className="relative flex h-full min-h-0 w-full max-w-[520px] flex-1 flex-col overflow-y-auto text-text">
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
