import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { Difficulty } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topicId, difficulty, accuracy, questionsSolved, unlocked, mastered } = body;

    if (!topicId || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure user exists in Prisma
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split("@")[0]
      }
    });

    const progress = await prisma.progress.upsert({
      where: {
        userId_topicId_difficulty: {
          userId: user.id,
          topicId: topicId,
          difficulty: difficulty as Difficulty
        }
      },
      update: {
        accuracy: parseFloat(accuracy),
        questionsSolved: parseInt(questionsSolved),
        unlocked: !!unlocked,
        mastered: !!mastered
      },
      create: {
        userId: user.id,
        topicId: topicId,
        difficulty: difficulty as Difficulty,
        accuracy: parseFloat(accuracy),
        questionsSolved: parseInt(questionsSolved),
        unlocked: !!unlocked,
        mastered: !!mastered
      }
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.warn("Prisma failed to save progress, falling back to local simulation:", error);
    return NextResponse.json({ success: false, error: "Database offline, using local storage instead" });
  }
}
