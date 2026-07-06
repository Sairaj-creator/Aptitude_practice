import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleQuestions } from "@/lib/data/catalog";

export default async function PracticePage({ params }: { params: Promise<{ topicSlug: string }> }) {
  const { topicSlug } = await params;
  const questions = sampleQuestions.filter((question) => question.topicSlug === topicSlug);
  const visibleQuestions = questions.length > 0 ? questions : sampleQuestions.slice(0, 2);

  return (
    <AppShell activeHref="/subjects">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Practice Mode</h1>
          <p className="mt-1 text-muted-foreground">Answer feedback includes explanation, shortcut, formula, and common mistake.</p>
        </div>
        <div className="space-y-4">
          {visibleQuestions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{question.difficulty}</Badge>
                  {question.companyTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="leading-6">{question.text}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {question.options.map((option) => (
                    <Button key={option} variant="outline" className="justify-start">
                      {option}
                    </Button>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-4">
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="font-semibold">Explanation</div>
                    <p className="mt-1 text-muted-foreground">{question.explanation}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="font-semibold">Trick</div>
                    <p className="mt-1 text-muted-foreground">{question.shortTrick}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="font-semibold">Mistake</div>
                    <p className="mt-1 text-muted-foreground">{question.commonMistake}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <div className="font-semibold">Formula</div>
                    <p className="mt-1 text-muted-foreground">{question.formula}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
