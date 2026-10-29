import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { fieldErrors, registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", fields: fieldErrors(parsed.error) }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists", fields: { email: "Email already in use" } },
      { status: 409 },
    );
  }

  // The very first account bootstraps the system as ADMIN; everyone after is a VIEWER.
  const isFirstUser = (await db.user.count()) === 0;
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: isFirstUser ? "ADMIN" : "VIEWER",
    },
  });

  await createSession({ sub: user.id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    { status: 201 },
  );
}
