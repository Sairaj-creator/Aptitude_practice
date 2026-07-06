import { describe, expect, it } from "vitest";
import { createTcsAttempt, estimatePercentile, sectionsForVariant, submitTcsSection } from "@/lib/tcs-nqt";

describe("tcs nqt engine", () => {
  it("uses only foundation sections for foundation-only variant", () => {
    const sections = sectionsForVariant("FOUNDATION_ONLY");
    expect(sections.map((section) => section.id)).toEqual(["numerical-ability", "reasoning-ability", "verbal-ability"]);
  });

  it("locks sections in sequence", () => {
    const { attempt } = createTcsAttempt("user-1", "FOUNDATION_ONLY", "attempt-1");
    expect(() => submitTcsSection(attempt, "reasoning-ability", {}, 10)).toThrow("Sections are locked in sequence");
  });

  it("submits current section and advances to the next section", () => {
    const { attempt } = createTcsAttempt("user-1", "FOUNDATION_ONLY", "attempt-1");
    const result = submitTcsSection(attempt, "numerical-ability", { "tcs-num-1": "400" }, 120);
    expect(result.submitted.score).toBe(1);
    expect(result.nextSection?.id).toBe("reasoning-ability");
    expect(result.attempt.status).toBe("IN_PROGRESS");
  });

  it("estimates percentile from score bands", () => {
    expect(estimatePercentile(86)).toBe(95);
    expect(estimatePercentile(52)).toBe(58);
  });
});
