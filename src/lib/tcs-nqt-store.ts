/**
 * TCS NQT attempt store — persists exclusively to Prisma (PostgreSQL).
 *
 * The previous version used an in-memory Map as a "cache" which caused
 * intermittent failures on Vercel (serverless) because each Lambda invocation
 * is an independent process with its own empty Map. All state is now read
 * from and written to the database on every request.
 */
import { createTcsAttempt, submitTcsSection, type TcsAttemptState, type SectionResult } from "@/lib/tcs-nqt";
import type { TcsNqtVariant, AttemptStatus } from "@/lib/data/tcs-nqt";
import { prisma } from "@/lib/prisma";

export async function startStoredAttempt(userId: string, variant: TcsNqtVariant) {
  const result = createTcsAttempt(userId, variant);

  // Ensure user row exists
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: userId.includes("@") ? userId : `${userId}@placeholder.com`,
      name: userId.split("-")[0]
    }
  });

  await prisma.tcsNqtAttempt.create({
    data: {
      id: result.attempt.id,
      userId,
      variant,
      startedAt: new Date(result.attempt.startedAt),
      currentOrder: result.attempt.currentSectionIndex + 1,
      sectionResults: JSON.stringify(result.attempt.sectionResults),
      status: "IN_PROGRESS"
    }
  });

  return result;
}

function dbRowToState(attempt: {
  id: string;
  userId: string;
  variant: string;
  startedAt: Date;
  completedAt: Date | null;
  currentOrder: number;
  sectionResults: unknown;
  overallScore: number | null;
  status: string;
}): TcsAttemptState {
  return {
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
}

export async function getStoredAttempt(id: string): Promise<TcsAttemptState | null> {
  try {
    const attempt = await prisma.tcsNqtAttempt.findUnique({ where: { id } });
    if (!attempt) return null;
    return dbRowToState(attempt);
  } catch (error) {
    console.warn("[tcs-nqt-store] Failed to get attempt:", error);
    return null;
  }
}

export async function submitStoredSection(
  id: string,
  sectionId: string,
  answers: Record<string, string>,
  timeTakenSec: number
) {
  const attempt = await getStoredAttempt(id);
  if (!attempt) throw new Error("Attempt not found");

  const result = submitTcsSection(attempt, sectionId, answers, timeTakenSec);

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

  return result;
}

/** List all attempts for a specific user (filtered — never returns all users' data). */
export async function listStoredAttempts(userId: string) {
  try {
    const dbAttempts = await prisma.tcsNqtAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" }
    });
    return dbAttempts.map(dbRowToState);
  } catch (error) {
    console.warn("[tcs-nqt-store] Failed to list attempts:", error);
    return [];
  }
}
