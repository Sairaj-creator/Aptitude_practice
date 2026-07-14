import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { generateQuestionsBatch, questionHash } from "@/lib/question-generation";
import { Difficulty } from "@prisma/client";

const MIN_POOL_SIZE = 25;

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topicSlug, difficulty, count = 10 } = await request.json() as {
      topicSlug: string;
      difficulty: string;
      count?: number;
    };

    if (!topicSlug || !difficulty) {
      return NextResponse.json({ error: "topicSlug and difficulty required" }, { status: 400 });
    }

    const diffEnum = difficulty.toUpperCase() as Difficulty;
    if (!["EASY", "MEDIUM", "HARD", "EXPERT"].includes(diffEnum)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }

    // Resolve topic
    const topic = await prisma.topic.findFirst({ where: { slug: topicSlug }, include: { subject: true } });
    if (!topic) return NextResponse.json({ error: "Topic not found. Run DB seed first." }, { status: 404 });

    // Cache-first gate: skip if pool already has MIN_POOL_SIZE
    const existingCount = await prisma.question.count({
      where: { topicId: topic.id, difficulty: diffEnum }
    });

    if (existingCount >= MIN_POOL_SIZE) {
      return NextResponse.json({ skipped: true, reason: `Pool already has ${existingCount} questions`, existingCount });
    }

    // Fetch existing hashes to deduplicate
    const existingQuestions = await prisma.question.findMany({
      where: { topicId: topic.id },
      select: { normalizedHash: true }
    });
    const existingHashes = new Set(existingQuestions.map((q) => q.normalizedHash));

    // Generate
    const result = await generateQuestionsBatch(topic.name, diffEnum, count, existingHashes);

    if (result.error) {
      return NextResponse.json({ error: result.error, generated: 0, accepted: 0 }, { status: 500 });
    }

    // Insert accepted questions
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
          difficulty: diffEnum,
          estimatedTimeSec: q.estimatedTimeSec,
          companyTags: q.companyTags
        })),
        skipDuplicates: true
      });

      // Log to AIQuestionGenerationLog
      await prisma.aIQuestionGenerationLog.create({
        data: {
          topicId: topic.id,
          difficulty: diffEnum,
          promptHash: questionHash(`${topic.name}:${diffEnum}:${Date.now()}`),
          generated: result.generated,
          accepted: result.accepted,
          rejected: result.rejected,
          provider: "groq-llama3-8b-8192"
        }
      });
    }

    return NextResponse.json({
      success: true,
      topicName: topic.name,
      difficulty: diffEnum,
      generated: result.generated,
      accepted: result.accepted,
      rejected: result.rejected
    });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
