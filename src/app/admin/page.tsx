import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminUserList, isInactive } from "@/lib/admin-data";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { AdminUserList } from "@/components/admin-user-list";
import { PageTransition } from "@/components/motion/page-transition";

export default async function AdminUsersPage() {
  await requireAdmin();
  const rows = await getAdminUserList();
  const withInactive = rows.map((r) => ({ ...r, inactive: isInactive(r) }));
  const activeCount = withInactive.filter((r) => !r.inactive).length;

  return (
    <AppShell nav="admin" wide>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5 xl:px-7 xl:py-5">
        <div className="flex items-center gap-2 xl:block">
          <span className="text-[16px] font-medium tracking-[-0.02em] xl:text-[19px]">Felhasználók</span>
          <span className="mono rounded-[5px] border border-border-strong px-1.5 py-1 text-[10px] text-text-secondary xl:hidden">
            ADMIN
          </span>
          <div className="mono mt-2 hidden text-[11px] text-text-faint xl:block">
            {rows.length} FIÓK · {activeCount} AKTÍV
          </div>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-[7px] bg-text px-2.75 py-2 text-[11.5px] font-medium text-bg transition-transform active:scale-95 xl:rounded-[8px] xl:px-4 xl:py-2.5 xl:text-[13px]"
        >
          + Új felhasználó
        </Link>
      </div>

      <PageTransition className="min-h-0">
        <AdminUserList rows={withInactive} />
      </PageTransition>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
