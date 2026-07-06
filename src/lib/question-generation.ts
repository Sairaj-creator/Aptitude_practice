import { createHash } from "node:crypto";

export function normalizeQuestionText(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function questionHash(text: string) {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}

export function dedupeGeneratedQuestions<T extends { text: string }>(questions: T[], existingHashes: Set<string>) {
  const seen = new Set(existingHashes);
  const accepted: Array<T & { normalizedHash: string }> = [];

  for (const question of questions) {
    const normalizedHash = questionHash(question.text);
    if (!seen.has(normalizedHash)) {
      seen.add(normalizedHash);
      accepted.push({ ...question, normalizedHash });
    }
  }

  return accepted;
}
