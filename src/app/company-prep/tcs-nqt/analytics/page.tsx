import { AppShell } from "@/components/app-shell";
import { PracticeOverviewChart } from "@/components/charts/practice-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TcsAnalyticsPage() {
  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">TCS NQT Analytics</h1>
          <p className="mt-1 text-muted-foreground">Trend, section movement, and benchmark comparison.</p>
        </div>
        <PracticeOverviewChart />
        <Card>
          <CardHeader>
            <CardTitle>Benchmark Flags</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["Numerical above cutoff", "Reasoning improving", "Verbal needs revision"].map((item) => (
              <div key={item} className="rounded-md border border-border p-4 text-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
