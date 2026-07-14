import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionsBatch, questionHash } from "@/lib/question-generation";
import { Difficulty } from "@prisma/client";

const MIN_SERVE_COUNT = 5;

export async function GET(request: Request, { params }: { params: Promise<{ topicSlug: string }> }) {
  try {
    const { topicSlug } = await params;
    const url = new URL(request.url);
    const diffParam = url.searchParams.get("difficulty")?.toUpperCase() ?? "EASY";
    const difficulty = (["EASY", "MEDIUM", "HARD", "EXPERT"].includes(diffParam) ? diffParam : "EASY") as Difficulty;

    const topic = await prisma.topic.findFirst({ where: { slug: topicSlug } });
    if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    let questions = await prisma.question.findMany({
      where: { topicId: topic.id, difficulty },
      orderBy: { createdAt: "asc" },
      take: 30
    });

    // Auto-generate if pool is thin
    if (questions.length < MIN_SERVE_COUNT) {
      const existingHashes = new Set(questions.map((q) => q.normalizedHash));
      const result = await generateQuestionsBatch(topic.name, difficulty, 10, existingHashes);

      if (result.questions.length > 0) {
        await prisma.question.createMany({
          data: result.questions.map((q) => ({
            topicId: topic.id,
            text: q.text,
            normalizedHash: q.normalizedHash,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            shortTrick: q.shortTrick,
            commonMistake: q.commonMistake,
            formula: q.formula,
            difficulty,
            estimatedTimeSec: q.estimatedTimeSec,
            companyTags: q.companyTags
          })),
          skipDuplicates: true
        });

        if (result.questions.length > 0) {
          await prisma.aIQuestionGenerationLog.create({
            data: {
              topicId: topic.id,
              difficulty,
              promptHash: questionHash(`${topic.name}:${difficulty}:${Date.now()}`),
              generated: result.generated,
              accepted: result.accepted,
              rejected: result.rejected,
              provider: "groq-llama3-8b-8192"
            }
          });
        }

        // Re-fetch after generation
        questions = await prisma.question.findMany({
          where: { topicId: topic.id, difficulty },
          orderBy: { createdAt: "asc" },
          take: 30
        });
      }
    }

    const formatted = questions.map((q) => ({
      id: q.id,
      topicSlug,
      text: q.text,
      options: q.options as string[],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      shortTrick: q.shortTrick ?? "Look for patterns and shortcuts.",
      commonMistake: q.commonMistake ?? "Read the question carefully.",
      formula: q.formula ?? "—",
      difficulty: q.difficulty,
      estimatedTimeSec: q.estimatedTimeSec,
      companyTags: q.companyTags
    }));

    return NextResponse.json({ questions: formatted, total: formatted.length });
  } catch (error) {
    console.error("Question fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
