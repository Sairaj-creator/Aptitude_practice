import Link from "next/link";
import { ArrowRight, Lock, CheckCircle2, Circle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { getSubject, topicSlug as makeSlug } from "@/lib/data/catalog";
import { notFound } from "next/navigation";

async function getTopicsWithProgress(subjectSlug: string, userId: string | null) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { slug: subjectSlug },
      include: {
        topics: {
          include: {
            progress: userId ? { where: { userId } } : false
          },
          orderBy: { name: "asc" }
        }
      }
    });
    return subject;
  } catch {
    return null;
  }
}

export default async function SubjectDetailPage({ params }: { params: Promise<{ subjectSlug: string }> }) {
  const { subjectSlug } = await params;
  const user = await getServerUser();

  const dbSubject = await getTopicsWithProgress(subjectSlug, user?.id ?? null);

  // DB fallback — use static catalog
  if (!dbSubject) {
    const subject = getSubject(subjectSlug);
    if (!subject) notFound();
    return (
      <AppShell activeHref="/subjects">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-normal">{subject.name}</h1>
            <p className="mt-1 text-muted-foreground">Each topic unlocks independently through mastery gates.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {subject.topics.map((topic) => (
              <Card key={topic}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{topic}</div>
                      <div className="mt-1 text-sm text-muted-foreground">Easy unlocked</div>
                    </div>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/subjects/${subject.slug}/${makeSlug(topic)}/practice`} aria-label={`Practice ${topic}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-4"><Progress value={0} /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeHref="/subjects">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{dbSubject.name}</h1>
          <p className="mt-1 text-muted-foreground">Each topic unlocks independently through mastery gates.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dbSubject.topics.map((topic) => {
            const progressRecords = topic.progress ?? [];
            const masteredCount = progressRecords.filter((p) => p.mastered).length;
            const unlockedCount = progressRecords.filter((p) => p.unlocked).length;
            const totalSolved = progressRecords.reduce((sum, p) => sum + p.questionsSolved, 0);
            const avgAccuracy = progressRecords.length > 0
              ? Math.round(progressRecords.reduce((sum, p) => sum + p.accuracy * 100, 0) / progressRecords.length)
              : 0;
            const progressPct = Math.round((masteredCount / 4) * 100);
            const isEasyUnlocked = progressRecords.length === 0 || progressRecords.some((p) => p.unlocked);

            return (
              <Card key={topic.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{topic.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {masteredCount > 0 && (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {masteredCount}/4 mastered
                          </Badge>
                        )}
                        {totalSolved > 0 && (
                          <Badge variant="outline" className="text-xs">{totalSolved} solved · {avgAccuracy}% acc</Badge>
                        )}
                        {totalSolved === 0 && (
                          <span className="text-xs text-muted-foreground">
                            {isEasyUnlocked ? <span className="flex items-center gap-1"><Circle className="h-3 w-3" /> Easy unlocked</span> : <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/subjects/${subjectSlug}/${topic.slug}/practice`} aria-label={`Practice ${topic.name}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-4"><Progress value={progressPct} /></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
