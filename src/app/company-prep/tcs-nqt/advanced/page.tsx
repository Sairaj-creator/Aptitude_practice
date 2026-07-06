import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tcsNqtPattern } from "@/lib/data/tcs-nqt";
import { formatDuration } from "@/lib/utils";

export default function AdvancedPage() {
  const sections = tcsNqtPattern.filter((section) => section.category === "ADVANCED");
  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-normal">Advanced</h1>
        <div className="grid gap-4 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div>{section.questionCount} questions</div>
                <div>{formatDuration(section.timeLimitSec)}</div>
                <p className="mt-3">{section.instructions}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
