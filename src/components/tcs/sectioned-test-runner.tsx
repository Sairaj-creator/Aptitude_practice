"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTestRunnerStore } from "@/stores/test-runner-store";
import { tcsNqtQuestions, tcsNqtPattern } from "@/lib/data/tcs-nqt";
import { formatDuration } from "@/lib/utils";

export function SectionedTestRunner({ attemptId }: { attemptId?: string }) {
  const fallbackSection = tcsNqtPattern[0];
  const [sectionId, setSectionId] = useState(fallbackSection.id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [warningOpen, setWarningOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(fallbackSection.timeLimitSec);
  const { setActiveSectionId, acknowledgedWarning, setAcknowledgedWarning } = useTestRunnerStore();

  const section = useMemo(() => tcsNqtPattern.find((item) => item.id === sectionId) ?? fallbackSection, [sectionId, fallbackSection]);
  const questions = tcsNqtQuestions.filter((question) => question.sectionId === section.id && !question.isCoding);
  const progress = ((section.timeLimitSec - remaining) / section.timeLimitSec) * 100;

  useEffect(() => {
    setActiveSectionId(section.id);
    setRemaining(section.timeLimitSec);
  }, [section.id, section.timeLimitSec, setActiveSectionId]);

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
  }, [section.id]);

  async function submit(auto = false) {
    if (!attemptId) {
      const next = tcsNqtPattern.find((item) => item.order === section.order + 1);
      setResult(auto ? "Auto-submitted local preview" : "Submitted local preview");
      if (next) setTimeout(() => setSectionId(next.id), 900);
      return;
    }

    const response = await fetch(`/api/tcs-nqt/attempt/${attemptId}/section/${section.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, timeTakenSec: section.timeLimitSec - remaining })
    });
    const data = await response.json();
    setResult(data.nextSection ? `${section.name} complete. ${data.nextSection.name} begins next.` : "TCS NQT mock completed.");
    if (data.nextSection) {
      setTimeout(() => {
        setSectionId(data.nextSection.id);
        setAnswers({});
        setAcknowledgedWarning(false);
      }, 1200);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge variant={section.category === "FOUNDATION" ? "success" : section.category === "ADVANCED" ? "warning" : "secondary"}>
              {section.category}
            </Badge>
            <h1 className="mt-3 text-2xl font-bold">{section.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{section.instructions}</p>
          </div>
          <div className="rounded-md border border-border bg-background px-4 py-3 text-right">
            <div className="flex items-center justify-end gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-primary" />
              {formatDuration(remaining)}
            </div>
            <div className="mt-2 w-40">
              <Progress value={progress} />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {questions.map((question, index) => (
            <fieldset key={question.id} className="rounded-md border border-border bg-background p-4">
              <legend className="px-1 text-sm font-semibold">Q{index + 1}</legend>
              <p className="text-sm leading-6">{question.questionText}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options?.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
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
