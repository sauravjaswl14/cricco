import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./jwt";

/** Reads and verifies the session cookie. Safe to call from RSC, actions and route handlers. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Issues a fresh JWT and stores it in an HTTP-only cookie (never exposed to client JS). */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

type Guard =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

/** Route-handler guard: 401 when signed out, 403 when `adminOnly` and the user is a viewer. */
export async function requireSession(options: { adminOnly?: boolean } = {}): Promise<Guard> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (options.adminOnly && session.role !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { ok: true, session };
}
