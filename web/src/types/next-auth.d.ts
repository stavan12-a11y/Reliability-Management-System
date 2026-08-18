import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

// next-auth/jwt.d.ts only re-exports from @auth/core/jwt (`export * from ...`),
// so the interface must be augmented at its actual declaration site to merge.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
