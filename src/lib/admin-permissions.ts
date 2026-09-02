import type { AdminPermissions } from "@/db/schema";

export const PERM_KEYS: [keyof AdminPermissions, string][] = [
  ["users", "Tagok kezelése"],
  ["workouts", "Edzések és kihívások"],
  ["stats", "Statisztikák"],
  ["admins", "Admin fiókok"],
];
