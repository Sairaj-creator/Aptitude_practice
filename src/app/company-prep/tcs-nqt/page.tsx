import Link from "next/link";
import { BarChart3, Code2, FileText, Gauge } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PatternStatus } from "@/components/tcs/pattern-status";
import { VariantToggle } from "@/components/tcs/variant-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/company-prep/tcs-nqt/overview", label: "Overview", icon: FileText },
  { href: "/company-prep/tcs-nqt/foundation", label: "Foundation", icon: Gauge },
  { href: "/company-prep/tcs-nqt/advanced", label: "Advanced", icon: BarChart3 },
  { href: "/company-prep/tcs-nqt/coding", label: "Coding", icon: Code2 },
  { href: "/company-prep/tcs-nqt/analytics", label: "Analytics", icon: BarChart3 }
];

export default function TcsNqtPage() {
  return (
    <AppShell activeHref="/company-prep">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-normal">TCS NQT</h1>
            <PatternStatus />
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Dedicated NQT simulation with Foundation-only and Foundation plus Advanced variants.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.href}>
                  <CardContent className="flex items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="font-semibold">{item.label}</div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={item.href}>Open</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Full Mock</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantToggle />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
