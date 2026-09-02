import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Edge-safe subset of the auth config (no Node-only imports like bcrypt or the
// DB client) — used by middleware to check session/role without decoding
// providers. The full config with providers lives in auth.ts.
export default {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: "user" | "admin" }).role ?? "user";
        token.adminPermissions =
          (user as { adminPermissions?: JWT["adminPermissions"] }).adminPermissions ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.adminPermissions = token.adminPermissions ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
