import { NextResponse } from "next/server";
import { recordMatch, UnknownPlayersError } from "@/lib/matches";
import { requireSession } from "@/lib/session";
import { fieldErrors, matchSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const guard = await requireSession({ adminOnly: true });
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fields: fieldErrors(parsed.error) }, { status: 400 });
  }

  try {
    const match = await recordMatch(parsed.data, guard.session.sub);
    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    if (error instanceof UnknownPlayersError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
