"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tcsNqtQuestions } from "@/lib/data/tcs-nqt";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

type Language = "c" | "cpp" | "java" | "python";

interface CodingPanelProps {
  attemptId?: string;
  question?: typeof tcsNqtQuestions[number];
  onCodeSubmit?: (code: string) => void;
}

export function CodingPanel({ attemptId, question: propQuestion, onCodeSubmit }: CodingPanelProps) {
  const fallbackQuestion = useMemo(() => tcsNqtQuestions.find((item) => item.isCoding), []);
  const question = propQuestion || fallbackQuestion;

  const [language, setLanguage] = useState<Language>("python");

  const initialCode = useMemo(() => {
    if (typeof window !== "undefined" && question?.id) {
      const key = `tcs-answers-${attemptId || 'local'}-${question.sectionId}`;
      const savedAnswers = localStorage.getItem(key);
      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          if (parsed[question.id]) {
            return parsed[question.id];
          }
        } catch (e) {
          console.error("Failed to parse saved answers", e);
        }
      }
    }
    return question?.starterCode ?? "";
  }, [question, attemptId]);

  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);
  const [output, setOutput] = useState<string>("No run yet");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const extensions = useMemo(() => {
    if (language === "python") return [python()];
    if (language === "java") return [java()];
    if (language === "cpp" || language === "c") return [cpp()];
    return [javascript()];
  }, [language]);

  async function run() {
    setRunning(true);
    setOutput("Running sample test cases...");
    try {
      const url = attemptId ? `/api/tcs-nqt/attempt/${attemptId}/coding/run` : "/api/tcs-nqt/attempt/local/coding/run";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, questionId: question?.id })
      });
      const data = await response.json();
      if (data.error) {
        setOutput(`Execution Error: ${data.error}`);
      } else {
        setOutput(`${data.passed}/${data.total} sample cases passed`);
      }
    } catch (err) {
      setOutput("Failed to run code sandbox");
    } finally {
      setRunning(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setOutput("Submitting code...");
    try {
      if (!attemptId) {
        setOutput("Submitted local preview (No active attempt)");
        if (onCodeSubmit) {
          onCodeSubmit(code);
        }
        setSubmitting(false);
        return;
      }
      const response = await fetch(`/api/tcs-nqt/attempt/${attemptId}/coding/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, questionId: question?.id })
      });
      const data = await response.json();
      if (data.error) {
        setOutput(`Submission Error: ${data.error}`);
      } else {
        setOutput(`Submitted! ${data.passed}/${data.total} sample cases passed`);
        if (onCodeSubmit) {
          onCodeSubmit(code);
        }
      }
    } catch (err) {
      setOutput("Failed to submit code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant="secondary">Coding</Badge>
            <h1 className="mt-3 text-2xl font-bold">{question?.questionText}</h1>
          </div>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm bg-card"
          >
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
        </div>
        <div className="mt-5 overflow-hidden rounded-md border border-border">
          <CodeMirror
            value={code}
            height="420px"
            extensions={extensions}
            onChange={(newCode) => {
              setCode(newCode);
              if (onCodeSubmit) {
                onCodeSubmit(newCode);
              }
            }}
            basicSetup={{ lineNumbers: true }}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={run} disabled={running || submitting}>
            <Play className="h-4 w-4" />
            {running ? "Running..." : "Run Samples"}
          </Button>
          <Button variant="outline" onClick={submit} disabled={running || submitting}>
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
      <aside className="rounded-lg border border-border bg-card p-5">
        <div className="text-sm font-semibold">Sample Cases</div>
        <div className="mt-3 space-y-3">
          {question?.testCases?.map((testCase) => (
            <div key={testCase.input} className="rounded-md border border-border bg-background p-3 text-sm">
              <div className="text-muted-foreground">Input</div>
              <pre className="mt-1 rounded-sm bg-muted p-2">{testCase.input}</pre>
              <div className="mt-2 text-muted-foreground">Expected</div>
              <pre className="mt-1 rounded-sm bg-muted p-2">{testCase.expectedOutput}</pre>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">{output}</div>
      </aside>
    </div>
  );
}
