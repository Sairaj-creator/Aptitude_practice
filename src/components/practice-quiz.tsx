"use client";

import { useState, useEffect } from "react";
import { Check, X, ArrowRight, BookOpen, AlertCircle, HelpCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { type PracticeQuestion } from "@/lib/data/catalog";
import { isDifficultyMastered } from "@/lib/mastery";


interface PracticeQuizProps {
  questions: PracticeQuestion[];
  topicSlug: string;
  onAnswerSubmitted?: (isCorrect: boolean) => void;
}

export function PracticeQuiz({ questions, topicSlug, onAnswerSubmitted }: PracticeQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [stats, setStats] = useState({ solved: 0, correct: 0 });
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "offline">("idle");

  const question = questions[currentIndex] || questions[0];

  useEffect(() => {
    // Load local stats
    const savedStats = localStorage.getItem(`practice_stats_${topicSlug}`);
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Failed to parse local practice stats:", e);
      }
    }
  }, [topicSlug]);

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || isAnswered) return;

    const correct = selectedOption === question.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);
    onAnswerSubmitted?.(correct);

    const nextStats = {
      solved: stats.solved + 1,
      correct: stats.correct + (correct ? 1 : 0)
    };
    setStats(nextStats);
    localStorage.setItem(`practice_stats_${topicSlug}`, JSON.stringify(nextStats));

    // Save progress to DB via API
    setSavingStatus("saving");
    try {
      const accuracy = nextStats.solved === 0 ? 0 : nextStats.correct / nextStats.solved;
      const response = await fetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topicSlug,
          difficulty: question.difficulty,
          accuracy: accuracy * 100,
          questionsSolved: nextStats.solved,
          unlocked: true,
          mastered: isDifficultyMastered({ accuracy, questionsSolved: nextStats.solved })
        })
      });
      const data = await response.json();
      if (data.success) {
        setSavingStatus("saved");
      } else {
        setSavingStatus("offline");
      }
    } catch (err) {
      console.warn("Could not save progress to database:", err);
      setSavingStatus("offline");
    }
  };

  const handleNext = () => {
    if (!isAnswered) return;
    if (!isCorrect && !acknowledged) return;

    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setAcknowledged(false);
    setSavingStatus("idle");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to start for continuous practice
      setCurrentIndex(0);
    }
  };

  const currentAccuracy = stats.solved > 0 ? Math.round((stats.correct / stats.solved) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Quiz Progress & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Topic Progress</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <Badge variant="outline" className="text-xs">
              Continuous Loop
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Accuracy</div>
            <div className="text-lg font-bold text-primary">{currentAccuracy}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Solved</div>
            <div className="text-lg font-bold text-primary">{stats.solved}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Sync</div>
            <div className="text-xs mt-1 font-medium">
              {savingStatus === "saving" && <span className="text-amber-500">Syncing...</span>}
              {savingStatus === "saved" && <span className="text-emerald-500">Synced</span>}
              {savingStatus === "offline" && <span className="text-amber-600" title="DB Offline, cached locally">Local Cache</span>}
              {savingStatus === "idle" && <span className="text-muted-foreground">Ready</span>}
            </div>
          </div>
        </div>
      </div>

      <Card className="border border-border shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Badge variant="secondary" className="capitalize">
                {question.difficulty.toLowerCase()}
              </Badge>
              {question.companyTags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Est. Time: {question.estimatedTimeSec}s</span>
          </div>
          <CardTitle className="text-xl leading-relaxed text-card-foreground">
            {question.text}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Options Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {question.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrectOption = option === question.correctAnswer;
              
              let btnClass = "border border-border hover:bg-muted text-left justify-start py-6 px-4 text-base font-normal h-auto w-full transition-all";
              let iconElement = null;

              if (isAnswered) {
                if (isSelected) {
                  if (isCorrect) {
                    btnClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300 font-semibold text-left justify-start py-6 px-4 text-base h-auto w-full";
                    iconElement = <Check className="ml-auto h-5 w-5 text-green-600 shrink-0" />;
                  } else {
                    btnClass = "border-destructive bg-destructive/10 text-destructive font-semibold text-left justify-start py-6 px-4 text-base h-auto w-full";
                    iconElement = <X className="ml-auto h-5 w-5 text-destructive shrink-0" />;
                  }
                } else if (isCorrectOption) {
                  btnClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300 text-left justify-start py-6 px-4 text-base h-auto w-full";
                  iconElement = <Check className="ml-auto h-5 w-5 text-green-600 shrink-0" />;
                }
              } else if (isSelected) {
                btnClass = "border-primary bg-primary/5 text-primary-foreground border-2 text-left justify-start py-6 px-4 text-base font-medium h-auto w-full";
              }

              return (
                <Button
                  key={option}
                  variant="ghost"
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered}
                  className={btnClass}
                >
                  <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                    {String.fromCharCode(65 + question.options.indexOf(option))}
                  </span>
                  <span className="truncate">{option}</span>
                  {iconElement}
                </Button>
              );
            })}
          </div>

          {/* Explanation Boxes (Shown after answering) */}
          {isAnswered && (
              <div
                className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                      <Check className="h-4 w-4" /> Correct Answer!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                      <X className="h-4 w-4" /> Incorrect. Correct option is "{question.correctAnswer}"
                    </span>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm mb-1.5 text-foreground">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Explanation
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm mb-1.5 text-foreground">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Shortcut Trick
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {question.shortTrick}
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm mb-1.5 text-foreground">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Common Mistake
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {question.commonMistake}
                    </p>
                  </div>

                  <div className="rounded-md border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 font-semibold text-sm mb-1.5 text-foreground">
                      <HelpCircle className="h-4 w-4 text-purple-500" />
                      Formula Used
                    </div>
                    <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                      {question.formula}
                    </p>
                  </div>
                </div>

                {/* Acknowledgment for Wrong Answer */}
                {!isCorrect && (
                  <div className="flex items-center gap-2.5 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                    <input
                      type="checkbox"
                      id="ack-mistake"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="ack-mistake" className="text-sm font-medium text-destructive cursor-pointer select-none">
                      I have reviewed the explanation and understood why my answer was incorrect.
                    </label>
                  </div>
                )}
              </div>
            )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t border-border pt-4 bg-muted/10">
          {!isAnswered ? (
            <Button onClick={handleSubmitAnswer} disabled={!selectedOption} className="gap-2">
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isCorrect && !acknowledged}
              className="gap-2"
            >
              Next Question
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
