import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tcsNqtPattern } from "@/lib/data/tcs-nqt";
import { formatDuration } from "@/lib/utils";

export default function TcsOverviewPage() {
  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-normal">TCS NQT Overview</h1>
            <p className="mt-1 text-muted-foreground">Exam pattern, eligibility, cutoffs, and full mock entry.</p>
          </div>
          <Button asChild>
            <Link href="/company-prep/tcs-nqt/full-mock">Start Full Mock</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Pattern</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="py-3">Category</th>
                  <th>Section</th>
                  <th>Questions</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {tcsNqtPattern.map((section) => (
                  <tr key={section.id} className="border-b border-border last:border-0">
                    <td className="py-3">{section.category}</td>
                    <td>{section.name}</td>
                    <td>{section.questionCount}</td>
                    <td>{formatDuration(section.timeLimitSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Engineering graduates and eligible final-year students can use the simulation profiles.</p>
              <p>Institution-specific rules should be maintained as admin-editable content.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cutoff Benchmarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Foundation target: 65% and above.</p>
              <p>Advanced target: 70% and above with coding samples passing.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
