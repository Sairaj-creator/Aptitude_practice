import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MockTestRunner from "./mock-test-runner";

async function getTestWithQuestions(testId: string) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          orderBy: { order: "asc" }
        }
      }
    });

    if (!test) return null;

    const questionIds = test.questions.map((tq) => tq.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } }
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Map back to maintain the correct order from TestQuestion
    const orderedQuestions = test.questions
      .map((tq) => {
        const q = questionMap.get(tq.questionId);
        if (!q) return null;
        return {
          id: tq.id,
          questionId: q.id,
          text: q.text,
          options: q.options as string[],
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    return {
      ...test,
      questions: orderedQuestions
    };
  } catch (error) {
    console.error("Failed to load test questions:", error);
    return null;
  }
}

export default async function MockTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const test = await getTestWithQuestions(testId);
  if (!test) notFound();

  const testData = {
    id: test.id,
    title: test.title,
    timeLimitSec: test.timeLimitSec,
    questions: test.questions
  };

  return <MockTestRunner test={testData} />;
}
