import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStoredAttempt } from "@/lib/tcs-nqt-store";
import { estimatePercentile } from "@/lib/tcs-nqt";
import { CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw } from "lucide-react";

export default async function TcsResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = await getStoredAttempt(attemptId);

  if (!attempt || attempt.status === "IN_PROGRESS") {
    return (
      <AppShell activeHref="/company-prep">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">TCS NQT Result</h1>
          <p className="text-muted-foreground">Attempt not found or still in progress.</p>
          <Button asChild><Link href="/company-prep/tcs-nqt">Back to TCS NQT</Link></Button>
        </div>
      </AppShell>
    );
  }

  const overallScore = attempt.overallScore ?? 0;
  const percentile = estimatePercentile(overallScore);
  const weakSections = attempt.sectionResults.filter((s) => s.weak);

  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal">TCS NQT Result</h1>
            <p className="mt-1 text-muted-foreground">Variant: {attempt.variant.replace("_", " ")}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/company-prep/tcs-nqt/full-mock">
              <RotateCcw className="mr-2 h-4 w-4" /> Retry Mock
            </Link>
          </Button>
        </div>

        {/* Score overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 border-primary">
            <CardContent className="p-6">
              <div className="text-4xl font-black text-primary">{Math.round(overallScore)}%</div>
              <div className="mt-1 text-sm text-muted-foreground">Overall Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-4xl font-black">{percentile}th</div>
              <div className="mt-1 text-sm text-muted-foreground">Estimated Percentile</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-4xl font-black text-destructive">{weakSections.length}</div>
              <div className="mt-1 text-sm text-muted-foreground">Weak Sections</div>
            </CardContent>
          </Card>
        </div>

        {/* Section-wise breakdown */}
        <Card>
          <CardHeader><CardTitle>Section Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {attempt.sectionResults.map((result) => {
              const pct = Math.round(result.accuracy * 100);
              const timeUsedPct = Math.round((result.timeTakenSec / result.timeLimitSec) * 100);
              return (
                <div key={result.sectionId} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">{result.sectionId.replace(/-/g, " ")}</span>
                    <div className="flex gap-2">
                      {result.weak
                        ? <Badge variant="danger"><AlertTriangle className="mr-1 h-3 w-3" />Weak</Badge>
                        : <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Good</Badge>}
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-medium">{result.score}/{result.total} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="mt-1 h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Time Used</span>
                        <span className="font-medium">{Math.round(result.timeTakenSec / 60)}m / {Math.round(result.timeLimitSec / 60)}m</span>
                      </div>
                      <Progress value={Math.min(timeUsedPct, 100)} className="mt-1 h-1.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {result.score >= result.total * 0.65
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className="text-muted-foreground text-xs">
                        {result.score >= result.total * 0.65 ? "Above cutoff (65%)" : "Below cutoff (65%)"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {weakSections.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Weak Sections — Practice Recommended
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {weakSections.map((s) => (
                <Badge key={s.sectionId} variant="danger">{s.sectionId.replace(/-/g, " ")}</Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button asChild><Link href="/company-prep/tcs-nqt/analytics">View Analytics Trend</Link></Button>
          <Button asChild variant="outline"><Link href="/company-prep/tcs-nqt">Back to TCS NQT</Link></Button>
        </div>
      </div>
    </AppShell>
  );
}
