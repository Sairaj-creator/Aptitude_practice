import Link from "next/link";
import { BarChart3, Bookmark, Brain, Building2, Gauge, Home, LineChart, Settings, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthStatus } from "@/components/auth/auth-status";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/subjects", label: "Subjects", icon: Brain },
  { href: "/mock-tests", label: "Mock Tests", icon: Gauge },
  { href: "/adaptive", label: "Adaptive", icon: Zap },
  { href: "/company-prep", label: "Company Prep", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/bookmarks", label: "Revision", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children, activeHref }: { children: React.ReactNode; activeHref?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card px-3 py-4 lg:block">
        <Link href="/" className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold">Placement Prep</div>
            <div className="text-xs text-muted-foreground">Mastery workspace</div>
          </div>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeHref ? activeHref === item.href : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-secondary text-secondary-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="truncate text-sm font-bold">Placement Prep</span>
            </div>
            <div className="hidden text-sm text-muted-foreground lg:block">Independent practice, company mocks, and mastery analytics</div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/company-prep/tcs-nqt">TCS NQT</Link>
              </Button>
              <AuthStatus />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
