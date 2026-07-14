import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";

export async function POST(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { testId } = await params;
    const { answers, timeTaken } = await request.json() as {
      answers: Record<string, string>;
      timeTaken: number;
    };

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: true
      }
    });

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // Fetch details of all questions in the test
    const questionIds = test.questions.map((tq) => tq.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswer: true, difficulty: true }
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email, name: user.name || user.email.split("@")[0] }
    });

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: user.id,
        testId,
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    const total = test.questions.length;
    let correct = 0;
    const perSecTime = total > 0 ? Math.round(timeTaken / total) : 0;

    const answerRows = test.questions.map((tq) => {
      const q = questionMap.get(tq.questionId);
      const selected = answers[tq.questionId] ?? "";
      const isCorrect = q ? selected === q.correctAnswer : false;
      if (isCorrect) correct++;
      return {
        attemptId: attempt.id,
        questionId: tq.questionId,
        selected,
        isCorrect,
        timeTakenSec: perSecTime,
        explanationAck: true
      };
    });

    await prisma.answer.createMany({ data: answerRows });

    const score = total > 0 ? (correct / total) * 100 : 0;
    await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { score }
    });

    return NextResponse.json({ attemptId: attempt.id, score, correct, total });
  } catch (error) {
    console.error("Mock test submit error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
