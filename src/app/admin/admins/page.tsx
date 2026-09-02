import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { initials } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { cn } from "@/lib/cn";
import { PERM_KEYS } from "@/lib/admin-permissions";

export default async function AdminAdminsPage() {
  await requireAdmin("admins");
  const admins = await db.select().from(users).where(eq(users.role, "admin"));

  return (
    <AppShell>
      <div className="px-5.5 pb-3 pt-1.5">
        <div className="text-[25px] font-extrabold leading-[1.1] tracking-[-0.03em]">Adminok</div>
        <div className="mono mt-2.25 text-[10.5px] tracking-[0.12em] text-white/65">
          {admins.length} FIÓK · JOGOSULTSÁGOKKAL
        </div>
      </div>

      <PageTransition className="gap-2.25 overflow-y-auto px-5.5 pb-8">
        {admins.map((a) => {
          const permText = a.adminPermissions
            ? PERM_KEYS.filter(([k]) => a.adminPermissions![k]).map(([, n]) => n).join(" · ") || "Nincs jogosultság"
            : "Teljes hozzáférés";
          return (
            <Link
              key={a.id}
              href={`/admin/admins/${a.id}`}
              className={cn(
                "flex flex-col gap-3 rounded-[22px] border border-white/15 p-4",
                a.isDefaultAdmin ? "bg-white/16" : "bg-white/8"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-white/16 text-[11.5px] font-bold">
                  {initials(a.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold">{a.name}</div>
                  <div className="mono mt-1.75 truncate text-[10.5px] text-white/60">{a.email}</div>
                </div>
                <span
                  className={cn(
                    "mono shrink-0 rounded-full px-2.5 py-1.5 text-[9.5px] font-bold tracking-[0.08em]",
                    a.isDefaultAdmin ? "bg-accent text-accent-fg" : "bg-white/16 text-white"
                  )}
                >
                  {a.isDefaultAdmin ? "ALAP" : a.adminPermissions ? "ADMIN" : "FŐ ADMIN"}
                </span>
              </div>
              <div className="text-[11px] font-semibold leading-[1.4] text-white/62">{permText}</div>
            </Link>
          );
        })}

        <Link
          href="/admin/admins/new"
          className="mt-1 rounded-full bg-white py-4 text-center text-[14px] font-extrabold text-brand-blue"
        >
          Új admin hozzáadása
        </Link>

        <div className="h-24 shrink-0" aria-hidden />
      </PageTransition>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
