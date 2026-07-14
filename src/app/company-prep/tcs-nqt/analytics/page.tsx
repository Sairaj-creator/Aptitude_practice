import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PracticeOverviewChart } from "@/components/charts/practice-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { estimatePercentile } from "@/lib/tcs-nqt";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

const NQT_CUTOFFS = { FOUNDATION_ONLY: 65, FOUNDATION_PLUS_ADVANCED: 70 };

async function getTcsAnalytics(userId: string) {
  try {
    const attempts = await prisma.tcsNqtAttempt.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { startedAt: "asc" }
    });

    return attempts.map((a) => ({
      id: a.id,
      date: a.startedAt.toLocaleDateString("en-IN"),
      variant: a.variant,
      score: a.overallScore ?? 0,
      percentile: estimatePercentile(a.overallScore ?? 0),
      sectionResults: JSON.parse(a.sectionResults as string) as Array<{ sectionId: string; accuracy: number; weak: boolean }>
    }));
  } catch {
    return null;
  }
}

export default async function TcsAnalyticsPage() {
  const user = await getServerUser();
  const attempts = user ? await getTcsAnalytics(user.id) : null;

  const latest = attempts?.[attempts.length - 1];
  const previous = attempts?.[attempts.length - 2];
  const scoreTrend = latest && previous ? latest.score - previous.score : null;

  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal">TCS NQT Analytics</h1>
            <p className="mt-1 text-muted-foreground">
              {attempts?.length ? `${attempts.length} full mock${attempts.length > 1 ? "s" : ""} completed` : "Trend, section movement, and benchmark comparison."}
            </p>
          </div>
          <Button asChild>
            <Link href="/company-prep/tcs-nqt/full-mock">Take Another Mock</Link>
          </Button>
        </div>

        {attempts && attempts.length > 0 ? (
          <>
            {/* Score trend */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="text-4xl font-black text-primary">{Math.round(latest?.score ?? 0)}%</div>
                  <div className="mt-1 text-sm text-muted-foreground">Latest Score</div>
                  {scoreTrend !== null && (
                    <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${scoreTrend >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {scoreTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {scoreTrend >= 0 ? "+" : ""}{Math.round(scoreTrend)}% vs previous
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-4xl font-black">{latest?.percentile}th</div>
                  <div className="mt-1 text-sm text-muted-foreground">Estimated Percentile</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-primary" />
                    <div>
                      <div className="text-lg font-bold">
                        {latest && latest.score >= NQT_CUTOFFS[latest.variant]
                          ? <span className="text-emerald-600">Above Cutoff ✓</span>
                          : <span className="text-destructive">Below Cutoff ✗</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Target: {latest ? NQT_CUTOFFS[latest.variant] : 65}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attempt history */}
            <Card>
              <CardHeader><CardTitle>All Attempts</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-3 text-left">Date</th>
                      <th className="text-left">Variant</th>
                      <th className="text-left">Score</th>
                      <th className="text-left">Percentile</th>
                      <th className="text-left">Result</th>
                      <th className="text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...attempts].reverse().map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0">
                        <td className="py-3">{a.date}</td>
                        <td>{a.variant === "FOUNDATION_ONLY" ? "Foundation" : "Full"}</td>
                        <td className="font-semibold">{Math.round(a.score)}%</td>
                        <td>{a.percentile}th</td>
                        <td>
                          {a.score >= NQT_CUTOFFS[a.variant]
                            ? <Badge variant="success">Pass</Badge>
                            : <Badge variant="danger">Below cutoff</Badge>}
                        </td>
                        <td>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/company-prep/tcs-nqt/results/${a.id}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Weak section flags */}
            {latest?.sectionResults.some((s) => s.weak) && (
              <Card className="border-destructive/20">
                <CardHeader><CardTitle className="text-destructive">Weak Sections (Latest Attempt)</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {latest.sectionResults.filter((s) => s.weak).map((s) => (
                    <Badge key={s.sectionId} variant="danger">{s.sectionId.replace(/-/g, " ")}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            <PracticeOverviewChart />
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Complete a full mock to see your analytics.</p>
                <Button asChild><Link href="/company-prep/tcs-nqt/full-mock">Start Full Mock</Link></Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
