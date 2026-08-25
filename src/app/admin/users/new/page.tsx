import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { AppShell } from "@/components/app-shell";
import { IconArrowLeft } from "@/components/icons";
import { NewUserForm } from "@/components/admin/new-user-form";
import { PageTransition } from "@/components/motion/page-transition";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <AppShell nav="admin">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href="/admin"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">Új felhasználó</span>
      </div>

      <PageTransition className="px-5 pb-6 pt-5">
        <NewUserForm />
      </PageTransition>
    </AppShell>
  );
}
