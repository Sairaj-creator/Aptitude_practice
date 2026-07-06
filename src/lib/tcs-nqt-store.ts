import { createTcsAttempt, submitTcsSection, type TcsAttemptState } from "@/lib/tcs-nqt";
import type { TcsNqtVariant } from "@/lib/data/tcs-nqt";

const attempts = new Map<string, TcsAttemptState>();

export function startStoredAttempt(userId: string, variant: TcsNqtVariant) {
  const result = createTcsAttempt(userId, variant);
  attempts.set(result.attempt.id, result.attempt);
  return result;
}

export function getStoredAttempt(id: string) {
  return attempts.get(id) ?? null;
}

export function submitStoredSection(
  id: string,
  sectionId: string,
  answers: Record<string, string>,
  timeTakenSec: number
) {
  const attempt = attempts.get(id);
  if (!attempt) {
    throw new Error("Attempt not found");
  }

  const result = submitTcsSection(attempt, sectionId, answers, timeTakenSec);
  attempts.set(id, result.attempt);
  return result;
}

export function listStoredAttempts() {
  return Array.from(attempts.values());
}
