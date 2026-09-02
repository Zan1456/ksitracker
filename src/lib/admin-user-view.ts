"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { ADMIN_USER_VIEW_COOKIE } from "@/lib/admin-user-view-cookie";

/** Lets an admin preview the member app without leaving their admin session. */
export async function enterUserViewAction() {
  await requireAdmin();
  const store = await cookies();
  store.set(ADMIN_USER_VIEW_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 6 });
  redirect("/");
}

export async function exitUserViewAction() {
  const store = await cookies();
  store.delete(ADMIN_USER_VIEW_COOKIE);
  redirect("/admin");
}

export async function isInUserView(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_USER_VIEW_COOKIE)?.value === "1";
}
