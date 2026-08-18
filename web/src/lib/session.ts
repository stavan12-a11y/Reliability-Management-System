import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";

const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  technician: 1,
  manager: 2,
};

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export class UnauthorizedError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Enforces a minimum role for a mutation. Every server action that writes
 * data must call this first — see BUILD_SPEC.md section 4 ("don't rely on
 * hiding buttons in the UI alone").
 */
export async function requireRole(minRole: Role) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError("You must be signed in.");
  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    throw new UnauthorizedError(`This action requires the ${minRole} role or higher.`);
  }
  return user;
}
