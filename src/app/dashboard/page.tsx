import { Activity, Brain, Clock, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PracticeOverviewChart } from "@/components/charts/practice-overview";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  return (
    <AppShell activeHref="/dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Practice volume, accuracy, weak areas, and mock-test movement.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Target} label="Overall Accuracy" value="84%" detail="Up 7% this week" />
          <StatCard icon={Brain} label="Topics Mastered" value="18" detail="Across quant, reasoning, verbal" />
          <StatCard icon={Clock} label="Avg Time" value="47s" detail="Per practice question" />
          <StatCard icon={Activity} label="Practice Streak" value="12d" detail="240 questions solved" />
        </div>
        <PracticeOverviewChart />
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              ["Easy", 100],
              ["Medium", 82],
              ["Hard", 43],
              ["Expert", 18]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">{label}</span>
                  <span className="text-muted-foreground">{value}%</span>
                </div>
                <Progress value={Number(value)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
