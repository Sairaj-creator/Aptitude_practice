import { describe, expect, it } from "vitest";
import { dedupeGeneratedQuestions, questionHash } from "@/lib/question-generation";

describe("question generation cache", () => {
  it("dedupes generated questions by normalized hash", () => {
    const existing = new Set([questionHash("What is 2 + 2?")]);
    const accepted = dedupeGeneratedQuestions(
      [
        { text: "What is 2 + 2?" },
        { text: "Find 40 percent of 200." }
      ],
      existing
    );

    expect(accepted).toHaveLength(1);
    expect(accepted[0].normalizedHash).toBe(questionHash("Find 40 percent of 200."));
  });
});
