import { createTcsAttempt, submitTcsSection, type TcsAttemptState, type SectionResult } from "@/lib/tcs-nqt";
import type { TcsNqtVariant, AttemptStatus } from "@/lib/data/tcs-nqt";
import { prisma } from "@/lib/prisma";

const attempts = new Map<string, TcsAttemptState>();

export async function startStoredAttempt(userId: string, variant: TcsNqtVariant) {
  const result = createTcsAttempt(userId, variant);
  
  try {
    // 1. Ensure user exists in Prisma
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: userId.includes("@") ? userId : `${userId}@placeholder.com`,
        name: userId.split("-")[0]
      }
    });

    // 2. Create attempt in Prisma
    await prisma.tcsNqtAttempt.create({
      data: {
        id: result.attempt.id,
        userId: userId,
        variant: variant,
        startedAt: new Date(result.attempt.startedAt),
        currentOrder: result.attempt.currentSectionIndex + 1,
        sectionResults: JSON.stringify(result.attempt.sectionResults),
        status: "IN_PROGRESS"
      }
    });
  } catch (error) {
    console.warn("Prisma failed to start attempt, falling back to memory Map:", error);
  }

  attempts.set(result.attempt.id, result.attempt);
  return result;
}

export async function getStoredAttempt(id: string): Promise<TcsAttemptState | null> {
  if (attempts.has(id)) {
    return attempts.get(id) ?? null;
  }

  try {
    const attempt = await prisma.tcsNqtAttempt.findUnique({
      where: { id }
    });

    if (attempt) {
      const state: TcsAttemptState = {
        id: attempt.id,
        userId: attempt.userId,
        variant: attempt.variant as TcsNqtVariant,
        startedAt: attempt.startedAt.toISOString(),
        completedAt: attempt.completedAt?.toISOString(),
        currentSectionIndex: attempt.currentOrder - 1,
        sectionResults: JSON.parse(attempt.sectionResults as string) as SectionResult[],
        overallScore: attempt.overallScore ?? undefined,
        status: attempt.status as AttemptStatus
      };
      attempts.set(id, state);
      return state;
    }
  } catch (error) {
    console.warn("Prisma failed to get attempt:", error);
  }

  return null;
}

export async function submitStoredSection(
  id: string,
  sectionId: string,
  answers: Record<string, string>,
  timeTakenSec: number
) {
  const attempt = await getStoredAttempt(id);
  if (!attempt) {
    throw new Error("Attempt not found");
  }

  const result = submitTcsSection(attempt, sectionId, answers, timeTakenSec);
  
  try {
    await prisma.tcsNqtAttempt.update({
      where: { id },
      data: {
        currentOrder: result.attempt.currentSectionIndex + 1,
        sectionResults: JSON.stringify(result.attempt.sectionResults),
        overallScore: result.attempt.overallScore ?? null,
        status: result.attempt.status as AttemptStatus,
        completedAt: result.attempt.completedAt ? new Date(result.attempt.completedAt) : null
      }
    });
  } catch (error) {
    console.warn("Prisma failed to update attempt, falling back to memory:", error);
  }

  attempts.set(id, result.attempt);
  return result;
}

export async function listStoredAttempts() {
  try {
    const dbAttempts = await prisma.tcsNqtAttempt.findMany({
      orderBy: { startedAt: "desc" }
    });
    const mapped = dbAttempts.map((attempt) => ({
      id: attempt.id,
      userId: attempt.userId,
      variant: attempt.variant as TcsNqtVariant,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString(),
      currentSectionIndex: attempt.currentOrder - 1,
      sectionResults: JSON.parse(attempt.sectionResults as string) as SectionResult[],
      overallScore: attempt.overallScore ?? undefined,
      status: attempt.status as AttemptStatus
    }));

    for (const item of mapped) {
      attempts.set(item.id, item);
    }
    return mapped;
  } catch (error) {
    console.warn("Prisma failed to list attempts, falling back to memory:", error);
  }

  return Array.from(attempts.values());
}
