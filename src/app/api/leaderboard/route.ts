import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rankByImpact } from "@/lib/players";
import { requireSession } from "@/lib/session";

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const players = await db.player.findMany();
  const leaderboard = rankByImpact(players).map((player, index) => ({
    rank: index + 1,
    ...player,
  }));
  return NextResponse.json({ leaderboard });
}
