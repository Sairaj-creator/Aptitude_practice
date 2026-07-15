import { createSupabaseBrowserClient } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isMock?: boolean;
}

const MOCK_USERS_KEY = "placement_prep_users";

export function isSupabaseEnabled(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("your-project") &&
    !supabaseAnonKey.includes("your-anon-key")
  );
}

/**
 * Set the session by calling the secure /api/auth/session endpoint.
 * The endpoint encrypts the user and sets an httpOnly cookie — the client
 * never handles the raw session value.
 */
async function postAuthSetSession(user: AuthUser | null): Promise<void> {
  if (typeof window === "undefined") return;
  if (user) {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user })
    });
  } else {
    await fetch("/api/auth/session", { method: "DELETE" });
  }
}

/**
 * Client-side session check.
 * - With Supabase: asks the Supabase browser client (which reads the Supabase cookie).
 * - Mock Mode: asks the /api/auth/session endpoint to decrypt the server-side cookie.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isSupabaseEnabled()) {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name || user.user_metadata?.full_name || undefined,
          isMock: false
        };
      }
    }
    return null;
  }

  // Mock Mode: fetch from the secure session API
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) return null;
    const data = await res.json() as { user: AuthUser | null };
    return data.user;
  } catch {
    return null;
  }
}

export async function signUp(email: string, name: string, password?: string): Promise<{ user: AuthUser | null; error?: string }> {
  if (isSupabaseEnabled()) {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || "placeholder123",
        options: { data: { name } }
      });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const authUser: AuthUser = { id: data.user.id, email: data.user.email ?? "", name, isMock: false };
        await postAuthSetSession(authUser);
        return { user: authUser };
      }
    }
  }

  // Fallback: Local Storage Mock
  if (typeof window === "undefined") return { user: null, error: "Window is undefined" };

  const users: Array<{ email: string; name: string; id: string }> = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { user: null, error: "User already exists with this email" };
  }

  const newMockUser = { id: `mock-${Math.random().toString(36).substr(2, 9)}`, email, name };
  users.push(newMockUser);
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));

  const authUser: AuthUser = { ...newMockUser, isMock: true };
  await postAuthSetSession(authUser);
  return { user: authUser };
}

export async function signIn(email: string, password?: string): Promise<{ user: AuthUser | null; error?: string }> {
  if (isSupabaseEnabled()) {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || "placeholder123"
      });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email ?? "",
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || undefined,
          isMock: false
        };
        await postAuthSetSession(authUser);
        return { user: authUser };
      }
    }
  }

  // Fallback: Local Storage Mock
  if (typeof window === "undefined") return { user: null, error: "Window is undefined" };

  const users: Array<{ email: string; name: string; id: string }> = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found) {
    // Return explicit error — do NOT silently create an account for a mistyped email
    return { user: null, error: "No account found with that email. Please sign up first." };
  }

  const authUser: AuthUser = { id: found.id, email: found.email, name: found.name, isMock: true };
  await postAuthSetSession(authUser);
  return { user: authUser };
}

export async function signOut(): Promise<void> {
  if (isSupabaseEnabled()) {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
  await postAuthSetSession(null);
}

export async function forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseEnabled()) {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
  }
  return { success: true };
}
