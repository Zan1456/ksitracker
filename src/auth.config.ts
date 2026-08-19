import type { NextAuthConfig } from "next-auth";

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
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "user" | "admin") ?? "user";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
