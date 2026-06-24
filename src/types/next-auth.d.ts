import type { Role } from "@/lib/authz/authorize";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      clientId: string | null;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    clientId?: string | null;
  }
}
