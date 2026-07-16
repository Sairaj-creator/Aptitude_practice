import { AppShell } from "@/components/app-shell";
import { PracticeOverviewChart } from "@/components/charts/practice-overview-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

async function getAnalyticsData(userId: string) {
  try {
    const [progressRecords, answers, attempts] = await Promise.all([
      prisma.progress.findMany({
        where: { userId },
        include: { topic: { include: { subject: true } } }
      }),
      prisma.answer.findMany({
        where: { attempt: { userId } },
        orderBy: { createdAt: "asc" },
        take: 1000
      }),
      prisma.testAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 30
      })
    ]);

    // Per-topic accuracy
    const topicMap: Record<string, { name: string; subject: string; accuracy: number; solved: number; mastered: boolean }> = {};
    for (const p of progressRecords) {
      const key = p.topicId;
      if (!topicMap[key]) {
        topicMap[key] = { name: p.topic.name, subject: p.topic.subject.name, accuracy: 0, solved: 0, mastered: false };
      }
      topicMap[key].solved += p.questionsSolved;
      topicMap[key].accuracy = p.questionsSolved > 0
        ? (topicMap[key].accuracy * (topicMap[key].solved - p.questionsSolved) + p.accuracy * p.questionsSolved) / topicMap[key].solved
        : topicMap[key].accuracy;
      if (p.mastered) topicMap[key].mastered = true;
    }

    const topicStats = Object.values(topicMap).sort((a, b) => a.accuracy - b.accuracy);
    const weakTopics = topicStats.filter((t) => t.accuracy < 0.6 && t.solved > 0).slice(0, 5);
    const strongTopics = topicStats.filter((t) => t.accuracy >= 0.8 && t.solved > 0).slice(-5).reverse();

    // Avg time
    const avgTime = answers.length > 0
      ? Math.round(answers.reduce((s, a) => s + a.timeTakenSec, 0) / answers.length)
      : 0;

    // Difficulty distribution
    const difficultyMap: Record<string, { solved: number; accuracy: number }> = {
      EASY: { solved: 0, accuracy: 0 },
      MEDIUM: { solved: 0, accuracy: 0 },
      HARD: { solved: 0, accuracy: 0 },
      EXPERT: { solved: 0, accuracy: 0 }
    };
    for (const p of progressRecords) {
      if (difficultyMap[p.difficulty]) {
        difficultyMap[p.difficulty].solved += p.questionsSolved;
        difficultyMap[p.difficulty].accuracy = p.accuracy;
      }
    }

    // Chart data
    const topicData = progressRecords
      .filter((p) => p.questionsSolved > 0)
      .map((p) => ({
        topic: p.topic.name.substring(0, 10),
        accuracy: Math.round(p.accuracy * 100)
      }))
      .slice(0, 10);

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trendMap: Record<string, { total: number; count: number }> = {};
    for (const a of attempts) {
      const date = a.completedAt || a.createdAt;
      const dayName = weekdays[new Date(date).getDay()];
      if (!trendMap[dayName]) {
        trendMap[dayName] = { total: 0, count: 0 };
      }
      trendMap[dayName].total += a.score;
      trendMap[dayName].count++;
    }

    const trendData = Object.entries(trendMap).map(([day, data]) => ({
      day,
      score: Math.round(data.total / data.count)
    }));

    return {
      weakTopics,
      strongTopics,
      avgTime,
      difficultyMap,
      totalAnswers: answers.length,
      topicData,
      trendData
    };
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const user = await getServerUser();
  const data = user ? await getAnalyticsData(user.id) : null;

  const weakTopics = data?.weakTopics ?? [];
  const strongTopics = data?.strongTopics ?? [];
  const totalAnswers = data?.totalAnswers ?? 0;
  const avgTime = data?.avgTime ?? 0;

  return (
    <AppShell activeHref="/analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            {data ? `${totalAnswers} questions analyzed · Avg time ${avgTime}s per question` : "Accuracy, time, trends, and difficulty distribution."}
          </p>
        </div>

        <PracticeOverviewChart
          topicData={data?.topicData ?? []}
          trendData={data?.trendData ?? []}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Weak Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-5 w-5" /> Weak Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakTopics.length > 0 ? (
                weakTopics.map((t) => (
                  <div key={t.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-destructive">{Math.round(t.accuracy * 100)}%</span>
                    </div>
                    <Progress value={Math.round(t.accuracy * 100)} className="h-1.5" />
                    <div className="text-xs text-muted-foreground">{t.subject} · {t.solved} solved</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No weak topics yet — keep practicing!</p>
              )}
            </CardContent>
          </Card>

          {/* Strong Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" /> Strong Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {strongTopics.length > 0 ? (
                strongTopics.map((t) => (
                  <div key={t.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.name}</span>
                      <div className="flex items-center gap-1">
                        {t.mastered && <Badge variant="success" className="text-xs">Mastered</Badge>}
                        <span className="text-emerald-600">{Math.round(t.accuracy * 100)}%</span>
                      </div>
                    </div>
                    <Progress value={Math.round(t.accuracy * 100)} className="h-1.5" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Complete 10+ questions in a topic to appear here.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Minus className="h-5 w-5" /> Difficulty Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {(["EASY", "MEDIUM", "HARD", "EXPERT"] as const).map((level) => {
              const d = data?.difficultyMap[level];
              const pct = d ? Math.round(d.accuracy * 100) : 0;
              const solved = d ? d.solved : 0;
              return (
                <div key={level} className="rounded-md border border-border p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold capitalize">{level.charAt(0) + level.slice(1).toLowerCase()}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                  <div className="mt-2 text-xs text-muted-foreground">{solved} solved</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
