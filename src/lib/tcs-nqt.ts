import { randomUUID } from "node:crypto";
import { tcsNqtPattern, tcsNqtQuestions, type AttemptStatus, type TcsNqtSectionConfig, type TcsNqtVariant } from "@/lib/data/tcs-nqt";

export type SectionResult = {
  sectionId: string;
  score: number;
  total: number;
  accuracy: number;
  timeTakenSec: number;
  timeLimitSec: number;
  weak: boolean;
};

export type TcsAttemptState = {
  id: string;
  userId: string;
  variant: TcsNqtVariant;
  startedAt: string;
  completedAt?: string;
  currentSectionIndex: number;
  sectionResults: SectionResult[];
  overallScore?: number;
  status: AttemptStatus;
};

export type StartAttemptResult = {
  attempt: TcsAttemptState;
  firstSection: TcsNqtSectionConfig;
};

export function sectionsForVariant(variant: TcsNqtVariant) {
  return tcsNqtPattern
    .filter((section) => variant === "FOUNDATION_PLUS_ADVANCED" || section.category === "FOUNDATION")
    .sort((a, b) => a.order - b.order);
}

export function createTcsAttempt(userId: string, variant: TcsNqtVariant, id: string = randomUUID()): StartAttemptResult {
  const sections = sectionsForVariant(variant);
  if (sections.length === 0) {
    throw new Error("No TCS NQT sections configured");
  }

  const attempt: TcsAttemptState = {
    id,
    userId,
    variant,
    startedAt: new Date().toISOString(),
    currentSectionIndex: 0,
    sectionResults: [],
    status: "IN_PROGRESS"
  };

  return {
    attempt,
    firstSection: sections[0]
  };
}

export function getCurrentSection(attempt: TcsAttemptState) {
  const sections = sectionsForVariant(attempt.variant);
  return sections[attempt.currentSectionIndex] ?? null;
}

export function scoreSection(sectionId: string, answers: Record<string, string>, timeTakenSec: number): SectionResult {
  const section = tcsNqtPattern.find((item) => item.id === sectionId);
  if (!section) {
    throw new Error(`Unknown TCS NQT section: ${sectionId}`);
  }

  const questions = tcsNqtQuestions.filter((question) => question.sectionId === sectionId && !question.isCoding);
  const score = questions.reduce((total, question) => {
    return total + (answers[question.id] === question.correctAnswer ? 1 : 0);
  }, 0);
  const total = questions.length || section.questionCount;
  const accuracy = total === 0 ? 0 : score / total;

  return {
    sectionId,
    score,
    total,
    accuracy,
    timeTakenSec,
    timeLimitSec: section.timeLimitSec,
    weak: accuracy < 0.6 || timeTakenSec > section.timeLimitSec
  };
}

export function submitTcsSection(
  attempt: TcsAttemptState,
  sectionId: string,
  answers: Record<string, string>,
  timeTakenSec: number
) {
  if (attempt.status !== "IN_PROGRESS") {
    throw new Error("Attempt is not in progress");
  }

  const sections = sectionsForVariant(attempt.variant);
  const currentSection = sections[attempt.currentSectionIndex];

  if (!currentSection) {
    throw new Error("Attempt has no active section");
  }

  if (currentSection.id !== sectionId) {
    throw new Error("Sections are locked in sequence");
  }

  const sectionResult = scoreSection(sectionId, answers, timeTakenSec);
  const nextResults = [...attempt.sectionResults, sectionResult];
  const nextIndex = attempt.currentSectionIndex + 1;
  const completed = nextIndex >= sections.length;
  const earned = nextResults.reduce((sum, result) => sum + result.score, 0);
  const possible = nextResults.reduce((sum, result) => sum + result.total, 0);

  const nextAttempt: TcsAttemptState = {
    ...attempt,
    currentSectionIndex: nextIndex,
    sectionResults: nextResults,
    overallScore: possible === 0 ? 0 : (earned / possible) * 100,
    status: completed ? "COMPLETED" : "IN_PROGRESS",
    completedAt: completed ? new Date().toISOString() : attempt.completedAt
  };

  return {
    attempt: nextAttempt,
    submitted: sectionResult,
    nextSection: completed ? null : sections[nextIndex]
  };
}

export function estimatePercentile(overallScore: number) {
  if (overallScore >= 85) return 95;
  if (overallScore >= 75) return 88;
  if (overallScore >= 65) return 76;
  if (overallScore >= 50) return 58;
  return 35;
}


const PISTON_API = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";

const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10" },
  c:      { language: "c",      version: "10.2.0" },
  cpp:    { language: "c++",    version: "10.2.0" },
  java:   { language: "java",   version: "15.0.2" }
};

/**
 * Execute code via the Piston sandbox API (https://emkc.org/api/v2/piston).
 * Piston runs code in isolated containers with no outbound network access,
 * read-only filesystem, and strict CPU/memory limits.
 */
async function executeCodeViaPiston(
  code: string,
  language: string,
  input: string,
  timeoutMs = 5000
): Promise<{ stdout: string; error?: string }> {
  const lang = PISTON_LANGUAGE_MAP[language.toLowerCase()];
  if (!lang) {
    return { stdout: "", error: `Language '${language}' is not supported` };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.PISTON_API_KEY) {
      headers["Authorization"] = process.env.PISTON_API_KEY;
    }

    const response = await fetch(PISTON_API, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        language: lang.language,
        version: lang.version,
        files: [{ content: code }],
        stdin: input,
        run_timeout: 3000,     // 3 s max execution time inside container
        compile_timeout: 10000 // 10 s max compile time
      })
    });

    if (!response.ok) {
      if (response.status === 401 || (!process.env.PISTON_API_KEY && !process.env.PISTON_API_URL)) {
        return {
          stdout: "",
          error: "Code execution is not configured for this deployment. Please configure PISTON_API_URL and PISTON_API_KEY (see README for self-hosting instructions)."
        };
      }
      return { stdout: "", error: `Sandbox API error: ${response.status}` };
    }

    const data = await response.json() as {
      run: { stdout: string; stderr: string; code: number; signal: string | null };
      compile?: { stderr: string; code: number };
    };

    // Propagate compile errors
    if (data.compile && data.compile.code !== 0) {
      return { stdout: "", error: data.compile.stderr.trim() || "Compilation failed" };
    }

    // Propagate runtime errors / non-zero exit
    if (data.run.code !== 0 || data.run.signal) {
      const errMsg = data.run.stderr.trim() || data.run.signal || `Exit code ${data.run.code}`;
      return { stdout: "", error: errMsg };
    }

    return { stdout: data.run.stdout };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { stdout: "", error: "Execution Timeout (Time Limit Exceeded)" };
    }
    // Fallback to local subprocess ONLY when explicitly permitted (e.g. local unit tests)
    if (process.env.NODE_ENV !== "production" && process.env.ALLOW_LOCAL_EXEC === "true" && language.toLowerCase() === "python") {
      return executeLocalPython(code, input);
    }
    if (!process.env.PISTON_API_KEY && !process.env.PISTON_API_URL) {
      return {
        stdout: "",
        error: "Code execution is not configured for this deployment. Please configure PISTON_API_URL and PISTON_API_KEY (see README for self-hosting instructions)."
      };
    }
    return { stdout: "", error: "Code execution service is temporarily unavailable" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Local fallback — ONLY used when ALLOW_LOCAL_EXEC=true.
 * Never enabled in production; exists solely so Vitest unit tests work offline.
 */
function executeLocalPython(code: string, input: string): Promise<{ stdout: string; error?: string }> {
  // Dynamic require keeps the subprocess imports out of the module graph
  // when running in sandboxed / serverless environments.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn }        = require("node:child_process") as typeof import("node:child_process");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { writeFileSync, unlinkSync } = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { join }         = require("node:path") as typeof import("node:path");

  return new Promise((resolve) => {
    const filename = join(process.cwd(), `temp_nqt_${randomUUID()}.py`);
    try { writeFileSync(filename, code, "utf8"); }
    catch { resolve({ stdout: "", error: "Failed to write temp execution file" }); return; }

    const py = spawn("python", [filename]);
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      py.kill();
      try { unlinkSync(filename); } catch { /* ignore */ }
      resolve({ stdout: "", error: "Execution Timeout (Time Limit Exceeded)" });
    }, 2000);

    py.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
    py.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

    py.on("close", (exitCode: number | null) => {
      clearTimeout(timer);
      try { unlinkSync(filename); } catch { /* ignore */ }
      if (exitCode !== 0) {
        resolve({ stdout: "", error: stderr.trim() || `Process exited with code ${exitCode}` });
      } else {
        resolve({ stdout });
      }
    });

    py.on("error", (err: Error) => {
      clearTimeout(timer);
      try { unlinkSync(filename); } catch { /* ignore */ }
      resolve({ stdout: "", error: err.message });
    });

    if (input) py.stdin.write(input + "\n");
    py.stdin.end();
  });
}

export async function runCodingSamples(code: string, language: string) {
  const codingQuestion = tcsNqtQuestions.find((question) => question.isCoding);
  const cases = codingQuestion?.testCases ?? [];

  const langKey = language.toLowerCase();
  const useLocal = process.env.NODE_ENV !== "production" && process.env.ALLOW_LOCAL_EXEC === "true" && langKey === "python";

  if (!useLocal && langKey !== "python" && !PISTON_LANGUAGE_MAP[langKey]) {
    return {
      language,
      sandbox: "unsupported",
      passed: 0,
      total: cases.length,
      results: cases.map((testCase) => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: "Language not supported. Use Python, C, C++, or Java.",
        passed: false
      }))
    };
  }

  const results = [];
  let passedCount = 0;

  for (const testCase of cases) {
    const res = useLocal
      ? await executeLocalPython(code, testCase.input)
      : await executeCodeViaPiston(code, language, testCase.input);
    const actual = res.stdout.trim();
    const expected = testCase.expectedOutput.trim();
    const passed = !res.error && actual === expected;
    if (passed) passedCount++;
    results.push({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput: res.error ? `Error: ${res.error}` : actual,
      passed
    });
  }

  return {
    language,
    sandbox: useLocal ? "local-python" : "piston",
    passed: passedCount,
    total: cases.length,
    results
  };
}
