import { describe, expect, it } from "vitest";
import { applyAdaptiveAnswer, createAdaptiveState } from "@/lib/adaptive";

describe("adaptive mode", () => {
  it("increases difficulty after three correct answers in a row", () => {
    let state = createAdaptiveState("EASY");
    state = applyAdaptiveAnswer(state, true);
    state = applyAdaptiveAnswer(state, true);
    state = applyAdaptiveAnswer(state, true);
    expect(state.difficulty).toBe("MEDIUM");
    expect(state.correctStreak).toBe(0);
  });

  it("decreases difficulty after two wrong answers in a row", () => {
    let state = createAdaptiveState("HARD");
    state = applyAdaptiveAnswer(state, false);
    state = applyAdaptiveAnswer(state, false);
    expect(state.difficulty).toBe("MEDIUM");
    expect(state.wrongStreak).toBe(0);
  });

  it("does not move outside the available difficulty range", () => {
    let state = createAdaptiveState("EASY");
    state = applyAdaptiveAnswer(state, false);
    state = applyAdaptiveAnswer(state, false);
    expect(state.difficulty).toBe("EASY");
  });
});
