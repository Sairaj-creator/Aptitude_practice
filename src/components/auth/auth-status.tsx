"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, signOut, type AuthUser } from "@/lib/auth";

export function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Failed to check auth state:", err);
      } finally {
        setLoading(false);
      }
    }
    void checkUser();
  }, []);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    router.push("/auth/login");
    router.refresh();
  }

  if (loading) {
    return <div className="h-9 w-20 animate-pulse rounded bg-muted" />;
  }

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/auth/login">Login</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right md:block">
        <div className="text-xs font-semibold truncate max-w-[120px]" title={user.name || user.email}>
          {user.name || user.email.split("@")[0]}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {user.isMock ? "Mock Session" : "Verified Student"}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
