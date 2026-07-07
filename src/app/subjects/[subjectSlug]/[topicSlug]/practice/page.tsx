import { AppShell } from "@/components/app-shell";
import { sampleQuestions } from "@/lib/data/catalog";
import { PracticeQuiz } from "@/components/practice-quiz";

export default async function PracticePage({ params }: { params: Promise<{ topicSlug: string }> }) {
  const { topicSlug } = await params;
  
  // Filter questions by topicSlug
  const questions = sampleQuestions.filter((q) => q.topicSlug === topicSlug);
  
  // Fallback to sample questions if none match (to support previewing all topics)
  const activeQuestions = questions.length > 0 ? questions : sampleQuestions;

  return (
    <AppShell activeHref="/subjects">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Practice Mode</h1>
          <p className="mt-1 text-muted-foreground">
            Get instant feedback on your answers, including shortcuts, explanations, and formulas.
          </p>
        </div>
        
        <PracticeQuiz questions={activeQuestions} topicSlug={topicSlug} />
      </div>
    </AppShell>
  );
}
