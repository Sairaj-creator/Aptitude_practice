"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type Question = {
  id: string;
  questionId: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
};

type TestData = {
  id: string;
  title: string;
  timeLimitSec: number;
  questions: Question[];
};

export default function MockTestRunner({ test }: { test: TestData }) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.timeLimitSec);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const res = await fetch(`/api/mock-tests/${test.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, timeTaken })
    });
    const data = await res.json();
    if (data.attemptId) {
      router.push(`/mock-tests/results/${data.attemptId}`);
    }
  }, [submitting, answers, test.id, startTime, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); submit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submit]);

  const question = test.questions[currentIdx];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / test.questions.length) * 100);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLow = timeLeft < 300;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <div>
          <div className="font-bold">{test.title}</div>
          <div className="text-sm text-muted-foreground">{answered}/{test.questions.length} answered</div>
        </div>
        <div className={`flex items-center gap-2 text-lg font-mono font-bold ${isLow ? "text-destructive" : "text-foreground"}`}>
          <Clock className="h-5 w-5" />
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      <Progress value={progress} />

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Q {currentIdx + 1} of {test.questions.length}</Badge>
            <Badge variant="secondary" className="capitalize">{question.difficulty.toLowerCase()}</Badge>
          </div>
          <CardTitle className="text-xl leading-relaxed mt-3">{question.text}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {question.options.map((opt, i) => {
              const isSelected = answers[question.questionId] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.questionId]: opt }))}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left text-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {currentIdx < test.questions.length - 1 ? (
          <Button onClick={() => setCurrentIdx((i) => i + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="gap-2">
            {submitting ? "Submitting..." : "Submit Test"}
          </Button>
        )}
      </div>
    </div>
  );
}
