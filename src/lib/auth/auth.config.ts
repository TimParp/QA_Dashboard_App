import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/authz/authorize";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role;
        token.clientId = (user as { clientId?: string | null }).clientId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (token.role) (session.user as { role?: Role }).role = token.role as Role;
        (session.user as { clientId?: string | null }).clientId =
          (token.clientId as string | null) ?? null;
      }
      return session;
    },
  },
};
