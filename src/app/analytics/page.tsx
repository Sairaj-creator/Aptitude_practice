import { AppShell } from "@/components/app-shell";
import { PracticeOverviewChart } from "@/components/charts/practice-overview";

export default function AnalyticsPage() {
  return (
    <AppShell activeHref="/analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Accuracy, time, trends, heatmap inputs, and difficulty distribution.</p>
        </div>
        <PracticeOverviewChart />
      </div>
    </AppShell>
  );
}
