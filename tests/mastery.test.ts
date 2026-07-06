import { describe, expect, it } from "vitest";
import { applyPracticeResult, createInitialProgress } from "@/lib/mastery";

describe("mastery gating", () => {
  it("keeps only easy unlocked by default", () => {
    const progress = createInitialProgress();
    expect(progress.find((item) => item.difficulty === "EASY")?.unlocked).toBe(true);
    expect(progress.find((item) => item.difficulty === "MEDIUM")?.unlocked).toBe(false);
  });

  it("unlocks the next difficulty after 80 percent accuracy over 10 questions", () => {
    const progress = createInitialProgress();
    const updated = applyPracticeResult(progress, "EASY", 8, 10);
    expect(updated.find((item) => item.difficulty === "EASY")?.mastered).toBe(true);
    expect(updated.find((item) => item.difficulty === "MEDIUM")?.unlocked).toBe(true);
  });

  it("does not unlock early when question count is below threshold", () => {
    const progress = createInitialProgress();
    const updated = applyPracticeResult(progress, "EASY", 5, 5);
    expect(updated.find((item) => item.difficulty === "MEDIUM")?.unlocked).toBe(false);
  });
});
