import { ComponentType, SVGProps } from "react";
import { IconDumbbell, IconTrophy, IconUser, IconUsers, IconClipboard, IconChart } from "@/components/icons";

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
    { href: "/admin", label: "Felhasználók", icon: IconUsers, exact: true },
    { href: "/admin/plans", label: "Edzéstervek", icon: IconClipboard },
    { href: "/admin/stats", label: "Statisztika", icon: IconChart },
  ],
};
