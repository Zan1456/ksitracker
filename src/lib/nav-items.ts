import { ComponentType, SVGProps } from "react";
import { IconDumbbell, IconTrophy, IconUser, IconUsers, IconClipboard, IconChart, IconShield } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  exact?: boolean;
};

export type NavVariant = "user" | "admin";

/** Shared between `BottomNav` (mobile) and `Sidebar` (desktop) so the two never drift apart. */
export const navItems: Record<NavVariant, NavItem[]> = {
  user: [
    { href: "/", label: "Edzések", icon: IconDumbbell, exact: true },
    { href: "/leaderboard", label: "Ranglista", icon: IconTrophy },
    { href: "/profile", label: "Profil", icon: IconUser },
  ],
  admin: [
    { href: "/admin", label: "Áttekintés", icon: IconChart, exact: true },
    { href: "/admin/users", label: "Tagok", icon: IconUsers },
    { href: "/admin/plans", label: "Edzések", icon: IconClipboard },
    { href: "/admin/admins", label: "Adminok", icon: IconShield },
  ],
};
