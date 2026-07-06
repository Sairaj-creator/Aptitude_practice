import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { companyConfigs } from "@/lib/data/catalog";

export default function CompanyPrepPage() {
  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Company Preparation</h1>
          <p className="mt-1 text-muted-foreground">TCS NQT has a dedicated route and engine. Other companies use configurable mock distributions.</p>
        </div>
        <Card className="border-primary">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">TCS NQT</div>
                <div className="text-sm text-muted-foreground">Sectioned timers, sequential locking, coding, and dedicated analytics.</div>
              </div>
            </div>
            <Button asChild>
              <Link href="/company-prep/tcs-nqt">
                Open TCS NQT
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companyConfigs.map((company) => (
            <Card key={company.companyName}>
              <CardHeader>
                <CardTitle>{company.companyName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="outline">{company.totalQuestions} Qs</Badge>
                  <Badge variant="secondary">{Math.round(company.timeLimitSec / 60)} min</Badge>
                </div>
                <Button className="mt-5 w-full" variant="outline">
                  Configure Mock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
