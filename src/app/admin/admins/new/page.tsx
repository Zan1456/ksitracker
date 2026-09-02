import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { AppShell } from "@/components/app-shell";
import { IconArrowLeft } from "@/components/icons";
import { AdminEditForm } from "@/components/admin/admin-edit-form";

export default async function NewAdminPage() {
  await requireAdmin("admins");

  return (
    <AppShell background="deep">
      <div className="flex items-center gap-3.25 px-5.5 pb-3 pt-1.5">
        <Link
          href="/admin/admins"
          aria-label="Vissza"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/16"
        >
          <IconArrowLeft width={16} height={16} strokeWidth={2} />
        </Link>
        <div>
          <div className="text-[19px] font-extrabold leading-[1.1] tracking-[-0.02em]">Új admin</div>
          <div className="mono mt-2 text-[10.5px] tracking-[0.1em] text-white/60">FIÓK LÉTREHOZÁSA</div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5.5 pb-8">
        <AdminEditForm admin={null} canDelete={false} />
      </div>
    </AppShell>
  );
}
