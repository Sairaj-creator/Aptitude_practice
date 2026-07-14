import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";
import { BookOpen, CalendarDays, ArrowRight } from "lucide-react";

async function getBookmarksAndQueue(userId: string) {
  try {
    const [bookmarks, queue] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: { question: { include: { topic: { include: { subject: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 50
      }),
      prisma.revisionQueue.findMany({
        where: { userId, completed: false, dueAt: { lte: new Date() } },
        orderBy: { priority: "desc", dueAt: "asc" },
        take: 20
      })
    ]);
    return { bookmarks, queue };
  } catch {
    return null;
  }
}

export default async function BookmarksPage() {
  const user = await getServerUser();
  const data = user ? await getBookmarksAndQueue(user.id) : null;

  return (
    <AppShell activeHref="/bookmarks">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Bookmarks &amp; Revision Queue</h1>
          <p className="mt-1 text-muted-foreground">Questions you've saved and items due for spaced-repetition review.</p>
        </div>

        {/* Revision Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Due Today
              {data?.queue.length ? <Badge variant="danger">{data.queue.length}</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.queue.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {data.queue.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-4 text-sm">
                    <div className="font-medium">Priority {item.priority}</div>
                    <div className="mt-1 text-muted-foreground">{item.source}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {data ? "Nothing due today. Great work!" : "Percent change traps · Seating arrangement · Preposition errors"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bookmarks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" /> Saved Questions
              {data?.bookmarks.length ? <Badge variant="outline">{data.bookmarks.length}</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.bookmarks.length ? (
              <div className="space-y-3">
                {data.bookmarks.map((bm) => (
                  <div key={bm.id} className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{bm.question.text}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs capitalize">{bm.question.difficulty.toLowerCase()}</Badge>
                        <Badge variant="outline" className="text-xs">{bm.question.topic.subject.name}</Badge>
                        <Badge variant="outline" className="text-xs">{bm.question.topic.name}</Badge>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/subjects/${bm.question.topic.subject.slug}/${bm.question.topic.slug}/practice`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {data ? "No bookmarks yet. Use the bookmark button during practice to save questions." : "Sign in to see your bookmarks."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
