import { describe, expect, it } from "vitest";
import { runCodingSamples } from "@/lib/tcs-nqt";

describe("TCS NQT Code Sandbox", () => {
  it("successfully compiles and passes correct Python code", async () => {
    const pythonCode = "n = int(input())\nprint(n * (n + 1) // 2)";
    const res = await runCodingSamples(pythonCode, "python");
    
    expect(res.language).toBe("python");
    expect(res.sandbox).toBe("local-python");
    expect(res.passed).toBe(2);
    expect(res.total).toBe(2);
    expect(res.results[0].passed).toBe(true);
    expect(res.results[1].passed).toBe(true);
    expect(res.results[0].actualOutput).toBe("15");
    expect(res.results[1].actualOutput).toBe("55");
  });

  it("fails on incorrect Python logic", async () => {
    const wrongCode = "n = int(input())\nprint(n + 1)";
    const res = await runCodingSamples(wrongCode, "python");

    expect(res.passed).toBe(0);
    expect(res.results[0].passed).toBe(false);
    expect(res.results[0].actualOutput).toBe("6"); // input 5 + 1 = 6 (expected 15)
  });

  it("gracefully catches syntax errors", async () => {
    const badSyntax = "print(invalid syntax";
    const res = await runCodingSamples(badSyntax, "python");

    expect(res.passed).toBe(0);
    expect(res.results[0].actualOutput).toContain("SyntaxError");
  });

  it("implements safety timeouts to prevent infinite loops", async () => {
    const infiniteLoop = "import time\nwhile True:\n    time.sleep(0.1)";
    const res = await runCodingSamples(infiniteLoop, "python");

    expect(res.passed).toBe(0);
    expect(res.results[0].actualOutput).toContain("Timeout");
  });
});
