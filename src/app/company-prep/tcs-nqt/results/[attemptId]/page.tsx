import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TcsResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">TCS NQT Result</h1>
          <p className="mt-1 text-muted-foreground">Attempt {attemptId}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <Badge variant="success">Score 78%</Badge>
            <Badge variant="secondary">Percentile 88</Badge>
            <Badge variant="warning">Weak: Verbal</Badge>
            <Badge variant="outline">Revision queued</Badge>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
