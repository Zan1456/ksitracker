import { DefaultSession } from "next-auth";
import type { AdminPermissions } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      // Only meaningful when role = "admin"; null = full access ("Fő admin").
      adminPermissions: AdminPermissions | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "admin";
    adminPermissions?: AdminPermissions | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "user" | "admin";
    adminPermissions?: AdminPermissions | null;
  }
}
