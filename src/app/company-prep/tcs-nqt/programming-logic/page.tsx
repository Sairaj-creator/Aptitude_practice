import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tcsNqtQuestions } from "@/lib/data/tcs-nqt";

export default function ProgrammingLogicPage() {
  const questions = tcsNqtQuestions.filter((question) => question.sectionId === "programming-logic");
  return (
    <AppShell activeHref="/company-prep">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-normal">Programming Logic</h1>
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>{question.questionText}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {question.options?.map((option) => (
                <div key={option} className="rounded-md border border-border p-3 text-sm">
                  {option}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
