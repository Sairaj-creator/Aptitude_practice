import { createSupabaseBrowserClient } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isMock?: boolean;
}

const SESSION_COOKIE_NAME = "placement_prep_session";
const MOCK_USERS_KEY = "placement_prep_users";

function postAuthSetCookie(user: AuthUser | null) {
  if (typeof document === "undefined") return;
  if (user) {
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

export function getSessionCookie(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${SESSION_COOKIE_NAME}=([^;]+)`));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2])) as AuthUser;
    } catch {
      return null;
    }
  }
  return null;
}

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
  }
  return getSessionCookie();
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
        postAuthSetCookie(authUser);
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
  postAuthSetCookie(authUser);
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
        postAuthSetCookie(authUser);
        return { user: authUser };
      }
    }
  }

  // Fallback: Local Storage Mock
  if (typeof window === "undefined") return { user: null, error: "Window is undefined" };

  const users: Array<{ email: string; name: string; id: string }> = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || "[]");
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found) {
    return signUp(email, email.split("@")[0]);
  }

  const authUser: AuthUser = { id: found.id, email: found.email, name: found.name, isMock: true };
  postAuthSetCookie(authUser);
  return { user: authUser };
}

export async function signOut(): Promise<void> {
  if (isSupabaseEnabled()) {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
  postAuthSetCookie(null);
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
