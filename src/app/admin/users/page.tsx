import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminUserList, isInactive } from "@/lib/admin-data";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { AdminUserList } from "@/components/admin-user-list";
import { PageTransition } from "@/components/motion/page-transition";

export default async function AdminUsersPage() {
  await requireAdmin("users");
  const rows = await getAdminUserList();
  const withInactive = rows.map((r) => ({ ...r, inactive: isInactive(r) }));

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3 px-5.5 pb-3 pt-1.5">
        <div className="text-[25px] font-extrabold leading-[1.1] tracking-[-0.03em]">Felhasználók</div>
        <Link
          href="/admin/users/new"
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform active:scale-95"
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
