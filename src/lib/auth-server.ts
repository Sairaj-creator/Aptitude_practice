import { cookies } from "next/headers";
import { type AuthUser } from "./auth";

export async function getServerUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("placement_prep_session");

    if (sessionCookie?.value) {
      return JSON.parse(decodeURIComponent(sessionCookie.value)) as AuthUser;
    }
  } catch (err) {
    console.error("Failed to parse server user session:", err);
  }

  return null;
}
