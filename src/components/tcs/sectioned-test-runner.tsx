"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { tcsNqtQuestions, tcsNqtPattern } from "@/lib/data/tcs-nqt";
import { formatDuration, cn } from "@/lib/utils";
import { CodingPanel } from "@/components/tcs/coding-panel";

interface SectionedTestRunnerProps {
  attemptId?: string;
  initialSectionId?: string;
  initialRemainingTime?: number;
}

export function SectionedTestRunner({
  attemptId,
  initialSectionId,
  initialRemainingTime
}: SectionedTestRunnerProps) {
  const fallbackSection = tcsNqtPattern[0];
  const [activeSectionId, setActiveSectionId] = useState<string>(initialSectionId || fallbackSection.id);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState<boolean>(false);

  const sectionId = initialSectionId || activeSectionId || fallbackSection.id;

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem(`tcs-answers-${attemptId || 'local'}-${sectionId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [warningOpen, setWarningOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(() => initialRemainingTime ?? fallbackSection.timeLimitSec);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const answersRef = useRef(answers);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isFirstMountRef = useRef(true);

  const section = useMemo(() => tcsNqtPattern.find((item) => item.id === sectionId) ?? fallbackSection, [sectionId, fallbackSection]);
  
  // Remove the !question.isCoding filter to include coding questions
  const questions = useMemo(() => tcsNqtQuestions.filter((question) => question.sectionId === section.id), [section.id]);
  
  // Clamped progress calculation
  const progress = Math.min(100, Math.max(0, ((section.timeLimitSec - remaining) / section.timeLimitSec) * 100));

  // Synchronize state when initialSectionId changes
  useEffect(() => {
    if (initialSectionId) {
      setActiveSectionId(initialSectionId);
    }
  }, [initialSectionId]);

  // Keep ref synced with latest answers and save to localStorage
  useEffect(() => {
    answersRef.current = answers;
    if (typeof window !== "undefined") {
      localStorage.setItem(`tcs-answers-${attemptId || 'local'}-${sectionId}`, JSON.stringify(answers));
    }
  }, [answers, attemptId, sectionId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Reset section state (remaining time, active question) when section changes
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (initialRemainingTime !== undefined) {
        return;
      }
    }
    setRemaining(section.timeLimitSec);
    setActiveQuestionIndex(0);
  }, [section.id, section.timeLimitSec, initialRemainingTime]);

  // Timer effect with proper cleanup - only depends on section.id
  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          void submit(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [section.id]); // submit function reference is stable because it relies on answersRef

  async function submit(auto = false) {
    const currentAnswers = answersRef.current;

    if (!attemptId) {
      const next = tcsNqtPattern.find((item) => item.order === section.order + 1);
      setResult(auto ? "Auto-submitted local preview" : "Submitted local preview");
      if (typeof window !== "undefined") {
        localStorage.removeItem(`tcs-answers-local-${section.id}`);
      }
      if (next) {
        timeoutRef.current = setTimeout(() => {
          setActiveSectionId(next.id);
          setAnswers({}); // Complete state reset for local mode
          setAcknowledgedWarning(false);
          setActiveQuestionIndex(0);
        }, 900);
      }
      return;
    }

    try {
      const response = await fetch(`/api/tcs-nqt/attempt/${attemptId}/section/${section.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: currentAnswers, timeTakenSec: section.timeLimitSec - remaining })
      });

      if (!response.ok) throw new Error("Submission failed");

      const data = await response.json();
      setResult(data.nextSection ? `${section.name} complete. ${data.nextSection.name} begins next.` : "TCS NQT mock completed.");
      
      if (typeof window !== "undefined") {
        localStorage.removeItem(`tcs-answers-${attemptId}-${section.id}`);
      }

      if (data.nextSection) {
        timeoutRef.current = setTimeout(() => {
          setActiveSectionId(data.nextSection.id);
          setAnswers({});
          setAcknowledgedWarning(false);
          setActiveQuestionIndex(0);
        }, 1200);
      }
    } catch (error) {
      setResult("Submission failed. Please check your connection and try again.");
    }
  }

  const activeQuestion = questions[activeQuestionIndex];

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between min-h-[500px]">
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <Badge variant={section.category === "FOUNDATION" ? "success" : section.category === "ADVANCED" ? "warning" : "secondary"}>
                {section.category}
              </Badge>
              <h1 className="mt-2 text-2xl font-bold">{section.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{section.instructions}</p>
            </div>
            <div className="rounded-md border border-border bg-background px-4 py-3 text-right shrink-0">
              <div className="flex items-center justify-end gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                {formatDuration(remaining)}
              </div>
              <div className="mt-2 w-40">
                <Progress value={progress} />
              </div>
            </div>
          </div>

          {/* Question Palette / Numbers */}
          {questions.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2 border-b border-border pb-4">
              {questions.map((_, idx) => {
                const isCurrent = idx === activeQuestionIndex;
                const isAnswered = !!answers[questions[idx].id];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded border text-xs font-semibold transition-all",
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow-sm"
                        : isAnswered
                          ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
                          : "border-border bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Q{idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          {/* Question Block */}
          <div className="mt-6">
            {!activeQuestion ? (
              <div className="rounded-md border border-border bg-background p-8 text-center text-sm text-muted-foreground">
                No questions configured for this section.
              </div>
            ) : activeQuestion.isCoding ? (
              <CodingPanel 
                question={activeQuestion} 
                attemptId={attemptId}
                onCodeSubmit={(code) => setAnswers(current => ({ ...current, [activeQuestion.id]: code }))}
              />
            ) : (
              <fieldset className="rounded-md border border-border bg-background p-5">
                <legend className="px-2 text-sm font-semibold text-primary">
                  Question {activeQuestionIndex + 1} of {questions.length}
                </legend>
                <p className="text-base font-medium leading-relaxed mt-2">{activeQuestion.questionText}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {activeQuestion.options?.map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-all hover:bg-muted/50",
                        answers[activeQuestion.id] === option
                          ? "border-primary bg-primary/5 font-semibold text-primary"
                          : "border-border bg-card"
                      )}
                    >
                      <input
                        type="radio"
                        name={activeQuestion.id}
                        value={option}
                        checked={answers[activeQuestion.id] === option}
                        onChange={() => setAnswers((current) => ({ ...current, [activeQuestion.id]: option }))}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </div>

        {/* Next and Previous Buttons */}
        {questions.length > 0 && (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4 bg-muted/5 p-4 rounded-b-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeQuestionIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Question
            </Button>

            <span className="text-xs font-medium text-muted-foreground">
              Q{activeQuestionIndex + 1} of {questions.length}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={activeQuestionIndex === questions.length - 1}
              className="gap-2"
            >
              Next Question
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <aside className="rounded-lg border border-border bg-card p-5">
        <div className="text-sm font-semibold">Sequential Lock</div>
        <p className="mt-2 text-sm text-muted-foreground">Submitting closes this section and moves forward only.</p>
        <div className="mt-4 space-y-2">
          {tcsNqtPattern.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-sm bg-background px-3 py-2 text-sm">
              <span>{item.name}</span>
              {item.id === section.id ? <Badge variant="outline">Active</Badge> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full" onClick={() => setWarningOpen(true)}>
          Submit Section
        </Button>
        {result && <div className="mt-4 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">{result}</div>}
      </aside>

      {warningOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <div className="text-base font-semibold">Submit {section.name}</div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Previous sections cannot be reopened after submission.</p>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={acknowledgedWarning} onChange={(event) => setAcknowledgedWarning(event.target.checked)} />
              I understand this section will be locked.
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWarningOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!acknowledgedWarning}
                onClick={() => {
                  setWarningOpen(false);
                  void submit(false);
                }}
              >
                <Check className="h-4 w-4" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}