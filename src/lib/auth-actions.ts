"use server";

import { signOut } from "@/auth";

/** Shared between the profile page and the admin panel (Sidebar / BottomNav) — one sign-out path for both roles. */
export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
