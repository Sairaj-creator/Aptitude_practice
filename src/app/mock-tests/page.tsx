import Link from "next/link";
import { Play, Plus, Clock, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";

async function getMockTests(userId: string) {
  try {
    const tests = await prisma.test.findMany({
      where: { mode: "MOCK" },
      include: {
        _count: { select: { questions: true } },
        attempts: { where: { userId }, orderBy: { createdAt: "desc" }, take: 1, select: { score: true, completedAt: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return tests;
  } catch {
    return null;
  }
}

const staticTests = [
  { id: "static-1", title: "Campus Aptitude Mock", totalQuestions: 60, timeLimitSec: 3600 },
  { id: "static-2", title: "Reasoning Sprint", totalQuestions: 35, timeLimitSec: 1800 },
  { id: "static-3", title: "Verbal Accuracy Set", totalQuestions: 40, timeLimitSec: 2100 }
];

export default async function MockTestsPage() {
  const user = await getServerUser();
  const dbTests = user ? await getMockTests(user.id) : null;

  return (
    <AppShell activeHref="/mock-tests">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-normal">Mock Tests</h1>
            <p className="mt-1 text-muted-foreground">Timed full-length tests across Quant, Reasoning, and Verbal.</p>
          </div>
          <form action="/api/mock-tests/generate" method="POST">
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" /> Generate New Test
            </Button>
          </form>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {dbTests && dbTests.length > 0
            ? dbTests.map((test) => {
                const lastAttempt = test.attempts[0];
                return (
                  <Card key={test.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{test.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {test._count.questions} questions
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {Math.round(test.timeLimitSec / 60)} minutes
                        </div>
                        {lastAttempt?.completedAt && (
                          <Badge variant="outline">Last: {Math.round(lastAttempt.score)}%</Badge>
                        )}
                      </div>
                      <Button asChild className="mt-5 w-full gap-2">
                        <Link href={`/mock-tests/${test.id}`}>
                          <Play className="h-4 w-4" /> Start
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            : staticTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{test.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4" />{test.totalQuestions} questions</div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{Math.round(test.timeLimitSec / 60)} minutes</div>
                    </div>
                    <Button className="mt-5 w-full gap-2" disabled>
                      <Play className="h-4 w-4" /> Generate questions first
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </AppShell>
  );
}
