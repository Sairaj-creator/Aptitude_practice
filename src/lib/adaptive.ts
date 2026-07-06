import { clamp } from "@/lib/utils";
import { difficultyOrder, type Difficulty } from "@/lib/mastery";

export type AdaptiveState = {
  difficulty: Difficulty;
  correctStreak: number;
  wrongStreak: number;
};

export function createAdaptiveState(difficulty: Difficulty = "EASY"): AdaptiveState {
  return {
    difficulty,
    correctStreak: 0,
    wrongStreak: 0
  };
}

export function applyAdaptiveAnswer(state: AdaptiveState, isCorrect: boolean): AdaptiveState {
  const correctStreak = isCorrect ? state.correctStreak + 1 : 0;
  const wrongStreak = isCorrect ? 0 : state.wrongStreak + 1;
  let difficultyIndex = difficultyOrder.indexOf(state.difficulty);

  if (difficultyIndex === -1) {
    difficultyIndex = 0;
  }

  if (correctStreak >= 3) {
    return {
      difficulty: difficultyOrder[clamp(difficultyIndex + 1, 0, difficultyOrder.length - 1)],
      correctStreak: 0,
      wrongStreak: 0
    };
  }

  if (wrongStreak >= 2) {
    return {
      difficulty: difficultyOrder[clamp(difficultyIndex - 1, 0, difficultyOrder.length - 1)],
      correctStreak: 0,
      wrongStreak: 0
    };
  }

  return {
    difficulty: state.difficulty,
    correctStreak,
    wrongStreak
  };
}
