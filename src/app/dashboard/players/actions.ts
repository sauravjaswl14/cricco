"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { fieldErrors, playerSchema } from "@/lib/validation";

export interface PlayerFormState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Echoed back so the form keeps what the user typed after a failed submit. */
  values?: Record<string, string>;
}

const FIELDS = ["name", "role", "basePrice", "matchesPlayed", "totalRuns", "totalWickets"] as const;

function readValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(FIELDS.map((key) => [key, String(formData.get(key) ?? "")]));
}

// Server Actions are public HTTP endpoints, so each one re-checks the session itself.
async function requireAdmin(): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Please sign in again.";
  if (session.role !== "ADMIN") return "Only admins can change players.";
  return null;
}

export async function createPlayerAction(
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const values = readValues(formData);

  const authError = await requireAdmin();
  if (authError) return { ok: false, message: authError, values };

  const parsed = playerSchema.safeParse(values);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ok: false, message: Object.values(errors)[0], errors, values };
  }

  await db.player.create({ data: parsed.data });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leaderboard");
  return { ok: true, message: `${parsed.data.name} added` };
}

export async function updatePlayerAction(
  id: string,
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const values = readValues(formData);

  const authError = await requireAdmin();
  if (authError) return { ok: false, message: authError, values };

  const parsed = playerSchema.safeParse(values);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ok: false, message: Object.values(errors)[0], errors, values };
  }

  const existing = await db.player.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, message: "Player not found", values };

  await db.player.update({ where: { id }, data: parsed.data });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leaderboard");
  return { ok: true, message: `${parsed.data.name} updated` };
}
