import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withImpactScore } from "@/lib/players";
import { requireSession } from "@/lib/session";
import { fieldErrors, playerSchema } from "@/lib/validation";

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const players = await db.player.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ players: players.map(withImpactScore) });
}

export async function POST(request: Request) {
  const guard = await requireSession({ adminOnly: true });
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = playerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fields: fieldErrors(parsed.error) }, { status: 400 });
  }

  const player = await db.player.create({ data: parsed.data });
  return NextResponse.json({ player: withImpactScore(player) }, { status: 201 });
}
