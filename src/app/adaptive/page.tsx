"use client";

import { useState, useCallback, useEffect } from "react";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PracticeQuiz } from "@/components/practice-quiz";
import { applyAdaptiveAnswer, createAdaptiveState, type AdaptiveState } from "@/lib/adaptive";
import type { PracticeQuestion } from "@/lib/data/catalog";
import type { Difficulty } from "@/lib/mastery";

const ADAPTIVE_STORAGE_KEY = "adaptive_state";

export default function AdaptivePage() {
  const [state, setState] = useState<AdaptiveState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(ADAPTIVE_STORAGE_KEY);
        return saved ? JSON.parse(saved) : createAdaptiveState("EASY");
      } catch {
        return createAdaptiveState("EASY");
      }
    }
    return createAdaptiveState("EASY");
  });

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [topicSlug, setTopicSlug] = useState("percentages");
  const [loading, setLoading] = useState(false);
  const [diffChanged, setDiffChanged] = useState<"up" | "down" | null>(null);

  const fetchQuestions = useCallback(async (slug: string, difficulty: Difficulty) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${slug}?difficulty=${difficulty}`);
      const data = await res.json() as { questions: PracticeQuestion[] };
      setQuestions(data.questions ?? []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions(topicSlug, state.difficulty);
  }, [topicSlug, state.difficulty, fetchQuestions]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setState((prev) => {
      const next = applyAdaptiveAnswer(prev, isCorrect);
      localStorage.setItem(ADAPTIVE_STORAGE_KEY, JSON.stringify(next));
      if (next.difficulty !== prev.difficulty) {
        setDiffChanged(next.difficulty > prev.difficulty ? "up" : "down");
        setTimeout(() => setDiffChanged(null), 3000);
        // Re-fetch questions at new difficulty
        fetchQuestions(topicSlug, next.difficulty);
      }
      return next;
    });
  }, [topicSlug, fetchQuestions]);

  const difficultyColors: Record<Difficulty, string> = {
    EASY: "bg-emerald-500/10 text-emerald-600 border-emerald-500",
    MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500",
    HARD: "bg-orange-500/10 text-orange-600 border-orange-500",
    EXPERT: "bg-red-500/10 text-red-600 border-red-500"
  };

  const topics = [
    { slug: "percentages", name: "Percentages" },
    { slug: "ratio-and-proportion", name: "Ratio & Proportion" },
    { slug: "number-series", name: "Number Series" },
    { slug: "profit-and-loss", name: "Profit & Loss" },
    { slug: "synonyms", name: "Synonyms" }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-normal">Adaptive Test Mode</h1>
        <p className="mt-1 text-muted-foreground">3 correct → harder. 2 wrong → easier. Difficulty adjusts automatically.</p>
      </div>

      {/* State display */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={`border-2 ${difficultyColors[state.difficulty]}`}>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current Difficulty</div>
            <div className="mt-1 text-2xl font-bold capitalize">{state.difficulty.toLowerCase()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Correct Streak</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{state.correctStreak}/3</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Wrong Streak</div>
            <div className="mt-1 text-2xl font-bold text-destructive">{state.wrongStreak}/2</div>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty change notification */}
      {diffChanged && (
        <div className={`flex items-center gap-2 rounded-md p-3 text-sm font-semibold ${
          diffChanged === "up" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"
        }`}>
          {diffChanged === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          Difficulty {diffChanged === "up" ? "increased" : "decreased"} to {state.difficulty}!
        </div>
      )}

      {/* Topic selector */}
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t.slug}
            onClick={() => { setTopicSlug(t.slug); fetchQuestions(t.slug, state.difficulty); }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              topicSlug === t.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Quiz */}
      {loading ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">Loading questions…</CardContent></Card>
      ) : questions.length > 0 ? (
        <PracticeQuiz questions={questions} topicSlug={topicSlug} onAnswerSubmitted={handleAnswer} />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No questions found. Questions will be generated on first load.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
