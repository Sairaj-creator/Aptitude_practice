import { AppShell } from "@/components/app-shell";
import { PracticeQuiz } from "@/components/practice-quiz";
import { prisma } from "@/lib/prisma";
import { sampleQuestions } from "@/lib/data/catalog";
import { Difficulty } from "@prisma/client";
import { notFound } from "next/navigation";

type SearchParams = Promise<{ difficulty?: string }>;

async function getQuestionsFromDB(topicSlug: string, difficulty: Difficulty) {
  try {
    const topic = await prisma.topic.findFirst({ where: { slug: topicSlug } });
    if (!topic) return null;

    const questions = await prisma.question.findMany({
      where: { topicId: topic.id, difficulty },
      orderBy: { createdAt: "asc" },
      take: 30
    });

    if (questions.length === 0) return null;

    return questions.map((q) => ({
      id: q.id,
      topicSlug,
      text: q.text,
      options: q.options as string[],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      shortTrick: q.shortTrick ?? "Look for patterns and shortcuts.",
      commonMistake: q.commonMistake ?? "Read the question carefully.",
      formula: q.formula ?? "—",
      difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD" | "EXPERT",
      estimatedTimeSec: q.estimatedTimeSec,
      companyTags: q.companyTags
    }));
  } catch {
    return null;
  }
}

export default async function PracticePage({
  params,
  searchParams
}: {
  params: Promise<{ subjectSlug: string; topicSlug: string }>;
  searchParams: SearchParams;
}) {
  const { topicSlug } = await params;
  const { difficulty: diffParam } = await searchParams;

  const difficulty = (["EASY", "MEDIUM", "HARD", "EXPERT"].includes(diffParam ?? "")
    ? diffParam
    : "EASY") as Difficulty;

  // Try DB first, fall back to static sample questions
  const dbQuestions = await getQuestionsFromDB(topicSlug, difficulty);
  const staticQuestions = sampleQuestions.filter((q) => q.topicSlug === topicSlug);
  const activeQuestions = dbQuestions ?? (staticQuestions.length > 0 ? staticQuestions : sampleQuestions);

  const difficultyLabel = difficulty.charAt(0) + difficulty.slice(1).toLowerCase();

  return (
    <AppShell activeHref="/subjects">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal capitalize">
              {topicSlug.replace(/-/g, " ")} — {difficultyLabel}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {dbQuestions
                ? `${dbQuestions.length} questions from database`
                : "Sample questions — trigger AI generation to load more"}
            </p>
          </div>
          <div className="flex gap-2">
            {(["EASY", "MEDIUM", "HARD", "EXPERT"] as const).map((d) => (
              <a
                key={d}
                href={`?difficulty=${d}`}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  d === difficulty
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </a>
            ))}
          </div>
        </div>
        <PracticeQuiz questions={activeQuestions} topicSlug={topicSlug} />
      </div>
    </AppShell>
  );
}
