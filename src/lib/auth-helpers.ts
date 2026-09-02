import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { AdminPermissions } from "@/db/schema";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/**
 * Requires an admin session. Pass a permission key to also require that
 * specific grant — an admin whose `adminPermissions` is `null` has full
 * access ("Fő admin") and passes any check; an admin with a granular
 * permission object is redirected home if that key is `false`.
 */
export async function requireAdmin(permission?: keyof AdminPermissions) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  if (permission && user.adminPermissions && !user.adminPermissions[permission]) redirect("/admin");
  return user;
}
