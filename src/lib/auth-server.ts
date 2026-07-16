import { cookies } from "next/headers";
import { type AuthUser, isSupabaseEnabled } from "./auth";
import { createSupabaseServerClient } from "./supabase-server";
import { decryptSession } from "./session";

const SESSION_COOKIE = "placement_prep_session";

/**
 * Retrieves and validates the current user on the server.
 *
 * When Supabase is configured: calls supabase.auth.getUser() which verifies
 * the JWT against Supabase's servers — not just trusting a cookie value.
 *
 * When Supabase is not configured (Mock Mode): decrypts the AES-256-GCM
 * encrypted session cookie set by /api/auth/session.
 */
export async function getServerUser(): Promise<AuthUser | null> {
  try {
    if (isSupabaseEnabled()) {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;
        return {
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name || user.user_metadata?.full_name || undefined,
          isMock: false
        };
      }
    }

    // Mock Mode: decrypt the encrypted session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return decryptSession(token);
  } catch (err) {
    console.error("[auth-server] Failed to get server user:", err);
    return null;
  }
}
