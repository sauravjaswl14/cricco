import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withImpactScore } from "@/lib/players";
import { requireSession } from "@/lib/session";
import { fieldErrors, playerSchema } from "@/lib/validation";

type Context = RouteContext<"/api/players/[id]">;

export async function GET(_request: Request, { params }: Context) {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const player = await db.player.findUnique({ where: { id } });
  if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  return NextResponse.json({ player: withImpactScore(player) });
}

export async function PUT(request: Request, { params }: Context) {
  const guard = await requireSession({ adminOnly: true });
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = playerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fields: fieldErrors(parsed.error) }, { status: 400 });
  }

  const existing = await db.player.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const player = await db.player.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ player: withImpactScore(player) });
}
