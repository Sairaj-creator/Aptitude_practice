export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export const difficultyOrder: Difficulty[] = ["EASY", "MEDIUM", "HARD", "EXPERT"];

export type ProgressRecord = {
  difficulty: Difficulty;
  accuracy: number;
  questionsSolved: number;
  unlocked: boolean;
  mastered: boolean;
};

export type MasteryThreshold = {
  minAccuracy: number;
  minQuestions: number;
};

export const defaultMasteryThreshold: MasteryThreshold = {
  minAccuracy: 0.8,
  minQuestions: 10
};

export function isDifficultyMastered(
  progress: Pick<ProgressRecord, "accuracy" | "questionsSolved">,
  threshold = defaultMasteryThreshold
) {
  return progress.accuracy >= threshold.minAccuracy && progress.questionsSolved >= threshold.minQuestions;
}

export function nextDifficulty(difficulty: Difficulty) {
  const index = difficultyOrder.indexOf(difficulty);
  return index === -1 || index === difficultyOrder.length - 1 ? null : difficultyOrder[index + 1];
}

export function createInitialProgress(): ProgressRecord[] {
  return difficultyOrder.map((difficulty) => ({
    difficulty,
    accuracy: 0,
    questionsSolved: 0,
    unlocked: difficulty === "EASY",
    mastered: false
  }));
}

export function applyPracticeResult(
  records: ProgressRecord[],
  difficulty: Difficulty,
  correct: number,
  total: number,
  threshold = defaultMasteryThreshold
) {
  if (total <= 0 || correct < 0 || correct > total) {
    throw new Error("Invalid practice result");
  }

  const nextRecords = records.map((record) => ({ ...record }));
  const record = nextRecords.find((item) => item.difficulty === difficulty);

  if (!record || !record.unlocked) {
    throw new Error(`Difficulty ${difficulty} is locked or missing`);
  }

  const previousCorrect = Math.round(record.accuracy * record.questionsSolved);
  const updatedSolved = record.questionsSolved + total;
  const updatedCorrect = previousCorrect + correct;

  record.questionsSolved = updatedSolved;
  record.accuracy = updatedCorrect / updatedSolved;
  record.mastered = isDifficultyMastered(record, threshold);

  const unlockTarget = record.mastered ? nextDifficulty(record.difficulty) : null;
  if (unlockTarget) {
    const targetRecord = nextRecords.find((item) => item.difficulty === unlockTarget);
    if (targetRecord) {
      targetRecord.unlocked = true;
    }
  }

  return nextRecords;
}
