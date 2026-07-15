import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { encryptSession, decryptSession } from "@/lib/session";
import type { AuthUser } from "@/lib/auth";

const SESSION_COOKIE = "placement_prep_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7 // 7 days
};

/** GET — read and decrypt the current session */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }
  const user = decryptSession(token);
  return NextResponse.json({ user });
}

/** POST — encrypt user data and set secure httpOnly session cookie */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { user: AuthUser };
    if (!body?.user?.id || !body?.user?.email) {
      return NextResponse.json({ error: "Invalid user payload" }, { status: 400 });
    }
    const token = encryptSession(body.user);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

/** DELETE — clear the session cookie */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
