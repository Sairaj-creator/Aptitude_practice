import { Activity, Brain, Clock, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PracticeOverviewChart } from "@/components/charts/practice-overview-dynamic";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";

async function getDashboardStats(userId: string) {
  try {
    const [progressRecords, answers, attempts] = await Promise.all([
      prisma.progress.findMany({
        where: { userId },
        include: { topic: true }
      }),
      prisma.answer.findMany({
        where: { attempt: { userId } },
        orderBy: { createdAt: "desc" },
        take: 500
      }),
      prisma.testAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 30
      })
    ]);

    const totalSolved = answers.length;
    const totalCorrect = answers.filter((a) => a.isCorrect).length;
    const overallAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;
    const masteredCount = progressRecords.filter((p) => p.mastered).length;
    const avgTimeSec = totalSolved > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.timeTakenSec, 0) / totalSolved)
      : 0;

    // Streak calculation based on completed test attempts & answer logs
    const activeDates = new Set<string>();
    attempts.forEach((a) => {
      if (a.completedAt) activeDates.add(a.completedAt.toISOString().split("T")[0]);
    });
    answers.forEach((ans) => {
      activeDates.add(ans.createdAt.toISOString().split("T")[0]);
    });

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (activeDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        // If they haven't practiced today, streak could still be alive if they practiced yesterday
        break;
      }
    }

    // Difficulty distribution
    const difficultyMap: Record<string, { solved: number; correct: number }> = {
      EASY: { solved: 0, correct: 0 },
      MEDIUM: { solved: 0, correct: 0 },
      HARD: { solved: 0, correct: 0 },
      EXPERT: { solved: 0, correct: 0 }
    };

    for (const p of progressRecords) {
      if (difficultyMap[p.difficulty]) {
        difficultyMap[p.difficulty].solved += p.questionsSolved;
        difficultyMap[p.difficulty].correct += Math.round(p.accuracy * p.questionsSolved);
      }
    }

    // Real DB-backed chart data
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
      overallAccuracy,
      masteredCount,
      avgTimeSec,
      streak,
      totalSolved,
      difficultyMap,
      topicData,
      trendData
    };
  } catch (error) {
    console.error("Failed to query dashboard stats from DB:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getServerUser();
  const stats = user ? await getDashboardStats(user.id) : null;

  const accuracy = stats?.overallAccuracy ?? 0;
  const mastered = stats?.masteredCount ?? 0;
  const avgTime = stats?.avgTimeSec ?? 0;
  const streak = stats?.streak ?? 0;
  const totalSolved = stats?.totalSolved ?? 0;

  const difficultyData = stats?.difficultyMap ?? {
    EASY: { solved: 0, correct: 0 },
    MEDIUM: { solved: 0, correct: 0 },
    HARD: { solved: 0, correct: 0 },
    EXPERT: { solved: 0, correct: 0 }
  };

  return (
    <AppShell activeHref="/dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            {stats ? "Live from your practice history." : "Practice volume, accuracy, weak areas, and mock-test movement."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Target} label="Overall Accuracy" value={`${accuracy}%`} detail={`${totalSolved} questions answered`} />
          <StatCard icon={Brain} label="Topics Mastered" value={String(mastered)} detail="Across quant, reasoning, verbal" />
          <StatCard icon={Clock} label="Avg Time" value={`${avgTime}s`} detail="Per practice question" />
          <StatCard icon={Activity} label="Practice Streak" value={`${streak}d`} detail={`${totalSolved} questions solved`} />
        </div>

        <PracticeOverviewChart
          topicData={stats?.topicData ?? []}
          trendData={stats?.trendData ?? []}
        />

        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {(["EASY", "MEDIUM", "HARD", "EXPERT"] as const).map((level) => {
              const d = difficultyData[level];
              const pct = d.solved > 0 ? Math.round((d.correct / d.solved) * 100) : 0;
              return (
                <div key={level} className="rounded-md border border-border p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold capitalize">{level.charAt(0) + level.slice(1).toLowerCase()}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                  <div className="mt-2 text-xs text-muted-foreground">{d.solved} solved</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
