import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

  describe("Piston API Integration (mocked)", () => {
    let fetchSpy: any;
    let originalLocalExec: string | undefined;

    beforeEach(() => {
      fetchSpy = vi.spyOn(globalThis, "fetch");
      originalLocalExec = process.env.ALLOW_LOCAL_EXEC;
      // Force Piston pathway by deleting ALLOW_LOCAL_EXEC env var
      delete process.env.ALLOW_LOCAL_EXEC;
    });

    afterEach(() => {
      vi.restoreAllMocks();
      if (originalLocalExec !== undefined) {
        process.env.ALLOW_LOCAL_EXEC = originalLocalExec;
      } else {
        delete process.env.ALLOW_LOCAL_EXEC;
      }
    });

    it("successfully compiles and returns stdout from Piston", async () => {
      // TCS NQT coding question has 2 test cases (sum from 1 to 5 = 15, and sum from 1 to 10 = 55)
      // So fetch will be called twice. We mock both calls.
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            run: { stdout: "15\n", stderr: "", code: 0, signal: null },
            compile: { stderr: "", code: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            run: { stdout: "55\n", stderr: "", code: 0, signal: null },
            compile: { stderr: "", code: 0 }
          })
        });

      const pythonCode = "n = int(input())\nprint(n * (n + 1) // 2)";
      const res = await runCodingSamples(pythonCode, "python");

      expect(res.sandbox).toBe("piston");
      expect(res.passed).toBe(2);
      expect(res.total).toBe(2);
      expect(res.results[0].passed).toBe(true);
      expect(res.results[0].actualOutput).toBe("15");
      expect(res.results[1].passed).toBe(true);
      expect(res.results[1].actualOutput).toBe("55");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("propagates compile errors from Piston", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          run: { stdout: "", stderr: "", code: 0, signal: null },
          compile: { stderr: "SyntaxError: invalid syntax", code: 1 }
        })
      });

      const res = await runCodingSamples("invalid code", "python");

      expect(res.passed).toBe(0);
      expect(res.results[0].actualOutput).toBe("Error: SyntaxError: invalid syntax");
    });

    it("propagates runtime errors from Piston", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          run: { stdout: "", stderr: "ZeroDivisionError: division by zero", code: 1, signal: null },
          compile: { stderr: "", code: 0 }
        })
      });

      const res = await runCodingSamples("1 / 0", "python");

      expect(res.passed).toBe(0);
      expect(res.results[0].actualOutput).toBe("Error: ZeroDivisionError: division by zero");
    });

    it("handles non-200 HTTP responses by returning unavailable", async () => {
      // Set PISTON_API_URL so it doesn't think it's the unconfigured default
      const originalUrl = process.env.PISTON_API_URL;
      const originalKey = process.env.PISTON_API_KEY;
      process.env.PISTON_API_URL = "http://my-piston/api";
      process.env.PISTON_API_KEY = "my-key";

      try {
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500
        });

        const res = await runCodingSamples("print(1)", "python");

        expect(res.passed).toBe(0);
        expect(res.results[0].actualOutput).toBe("Error: Sandbox API error: 500");
      } finally {
        if (originalUrl !== undefined) {
          process.env.PISTON_API_URL = originalUrl;
        } else {
          delete process.env.PISTON_API_URL;
        }
        if (originalKey !== undefined) {
          process.env.PISTON_API_KEY = originalKey;
        } else {
          delete process.env.PISTON_API_KEY;
        }
      }
    });

    it("returns 'not configured' if fetch returns 401", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const res = await runCodingSamples("print(1)", "python");

      expect(res.passed).toBe(0);
      expect(res.results[0].actualOutput).toContain("Code execution is not configured for this deployment");
    });

    it("returns 'not configured' if no key is configured on public API", async () => {
      // Simulate calling default URL without a key
      const originalUrl = process.env.PISTON_API_URL;
      const originalKey = process.env.PISTON_API_KEY;
      delete process.env.PISTON_API_URL;
      delete process.env.PISTON_API_KEY;

      try {
        fetchSpy.mockRejectedValueOnce(new Error("Failed to fetch"));

        const res = await runCodingSamples("print(1)", "python");

        expect(res.passed).toBe(0);
        expect(res.results[0].actualOutput).toContain("Code execution is not configured for this deployment");
      } finally {
        if (originalUrl !== undefined) {
          process.env.PISTON_API_URL = originalUrl;
        } else {
          delete process.env.PISTON_API_URL;
        }
        if (originalKey !== undefined) {
          process.env.PISTON_API_KEY = originalKey;
        } else {
          delete process.env.PISTON_API_KEY;
        }
      }
    });

    it("handles fetch/network timeouts gracefully", async () => {
      // Set PISTON_API_URL to bypass unconfigured error check in catch
      const originalUrl = process.env.PISTON_API_URL;
      process.env.PISTON_API_URL = "http://my-piston/api";

      try {
        const abortError = new Error("The user aborted a request.");
        abortError.name = "AbortError";
        fetchSpy.mockRejectedValueOnce(abortError);

        const res = await runCodingSamples("print(1)", "python");

        expect(res.passed).toBe(0);
        expect(res.results[0].actualOutput).toBe("Error: Execution Timeout (Time Limit Exceeded)");
      } finally {
        if (originalUrl !== undefined) {
          process.env.PISTON_API_URL = originalUrl;
        } else {
          delete process.env.PISTON_API_URL;
        }
      }
    });
  });
});
