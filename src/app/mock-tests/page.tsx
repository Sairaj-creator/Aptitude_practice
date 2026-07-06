import { Play } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tests = [
  ["Campus Aptitude Mock", "60 questions", "60 minutes"],
  ["Reasoning Sprint", "35 questions", "30 minutes"],
  ["Verbal Accuracy Set", "40 questions", "35 minutes"]
];

export default function MockTestsPage() {
  return (
    <AppShell activeHref="/mock-tests">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Mock Tests</h1>
          <p className="mt-1 text-muted-foreground">Standard practice engine for generic and non-TCS company tests.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {tests.map(([title, questions, time]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>{questions}</div>
                  <div>{time}</div>
                </div>
                <Button className="mt-5 w-full">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
