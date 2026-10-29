import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { fieldErrors, loginSchema } from "@/lib/validation";

// Compared against when the email is unknown so response time doesn't reveal
// which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fields: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // The JWT travels only in an HTTP-only Set-Cookie header, never in the JSON body.
  await createSession({ sub: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
