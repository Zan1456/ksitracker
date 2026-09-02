import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type UserSettings = {
  soundEnabled: boolean;
  reminderEnabled: boolean;
  autoRestEnabled: boolean;
};

const DEFAULTS: UserSettings = { soundEnabled: true, reminderEnabled: true, autoRestEnabled: false };

/** The three member-facing toggles from the profile screen. Falls back to defaults if the user row is somehow missing. */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const [row] = await db
    .select({
      soundEnabled: users.soundEnabled,
      reminderEnabled: users.reminderEnabled,
      autoRestEnabled: users.autoRestEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? DEFAULTS;
}
