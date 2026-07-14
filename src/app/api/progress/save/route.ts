import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { isDifficultyMastered, nextDifficulty, type Difficulty } from "@/lib/mastery";
import { Difficulty as PrismaDifficulty } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topicId: topicIdOrSlug, difficulty, accuracy, questionsSolved, unlocked, mastered } = body;

    if (!topicIdOrSlug || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Resolve topicId: accept CUID directly OR slug string
    let topicId: string = topicIdOrSlug;
    const isCuid = /^[a-z0-9]{25}$/.test(topicIdOrSlug);
    if (!isCuid) {
      // It's a slug — look it up
      const topic = await prisma.topic.findFirst({ where: { slug: topicIdOrSlug } });
      if (!topic) {
        // Topic not seeded yet — return offline mode gracefully
        return NextResponse.json({ success: false, error: "Topic not found in DB" });
      }
      topicId = topic.id;
    }

    // Ensure user exists in Prisma
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email, name: user.name || user.email.split("@")[0] }
    });

    const accuracyFloat = parseFloat(accuracy) / 100; // convert from percentage
    const solvedInt = parseInt(questionsSolved);
    const isMastered = mastered ?? isDifficultyMastered({ accuracy: accuracyFloat, questionsSolved: solvedInt });

    const progress = await prisma.progress.upsert({
      where: {
        userId_topicId_difficulty: {
          userId: user.id,
          topicId,
          difficulty: difficulty as PrismaDifficulty
        }
      },
      update: {
        accuracy: accuracyFloat,
        questionsSolved: solvedInt,
        unlocked: !!unlocked,
        mastered: isMastered
      },
      create: {
        userId: user.id,
        topicId,
        difficulty: difficulty as PrismaDifficulty,
        accuracy: accuracyFloat,
        questionsSolved: solvedInt,
        unlocked: !!unlocked,
        mastered: isMastered
      }
    });

    // If just mastered, unlock the next difficulty level
    let unlockedNext: string | null = null;
    if (isMastered) {
      const next = nextDifficulty(difficulty as Difficulty);
      if (next) {
        await prisma.progress.upsert({
          where: { userId_topicId_difficulty: { userId: user.id, topicId, difficulty: next as PrismaDifficulty } },
          update: { unlocked: true },
          create: { userId: user.id, topicId, difficulty: next as PrismaDifficulty, unlocked: true, accuracy: 0, questionsSolved: 0, mastered: false }
        });
        unlockedNext = next;
      }
    }

    return NextResponse.json({ success: true, progress, unlockedNext });
  } catch (error) {
    console.warn("Prisma failed to save progress:", error);
    return NextResponse.json({ success: false, error: "Database offline, using local storage instead" });
  }
}
