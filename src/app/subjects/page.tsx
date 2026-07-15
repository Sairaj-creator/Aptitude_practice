import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { subjectCatalog } from "@/lib/data/catalog";

async function getSubjectsWithTopicCounts() {
  try {
    return await prisma.subject.findMany({
      include: { _count: { select: { topics: true } }, topics: { select: { name: true }, take: 9 } },
      orderBy: { name: "asc" }
    });
  } catch {
    return null;
  }
}

export default async function SubjectsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const dbSubjects = await getSubjectsWithTopicCounts();
  const { error } = await searchParams;

  return (
    <AppShell activeHref="/subjects">
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            <div className="flex items-center gap-2 font-semibold">
              <span role="img" aria-label="warning">⚠️</span>
              <span>Notice</span>
            </div>
            <p className="mt-1">{decodeURIComponent(error)}</p>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Subjects</h1>
          <p className="mt-1 text-muted-foreground">Topic pools with Easy → Medium → Hard → Expert mastery progression.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {dbSubjects
            ? dbSubjects.map((subject) => (
                <Card key={subject.slug}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {subject.name}
                      <Badge variant="secondary">{subject._count.topics} topics</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-5 flex flex-wrap gap-2">
                      {subject.topics.map((t) => (
                        <Badge key={t.name} variant="outline">{t.name}</Badge>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/subjects/${subject.slug}`}>
                        Open Topics <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            : subjectCatalog.map((subject) => (
                // Fallback to static catalog when DB is not seeded yet
                <Card key={subject.slug}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {subject.name}
                      <Badge variant="outline">{subject.topics.length} topics</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-5 flex flex-wrap gap-2">
                      {subject.topics.slice(0, 9).map((topic) => (
                        <Badge key={topic} variant="outline">{topic}</Badge>
                      ))}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/subjects/${subject.slug}`}>
                        Open Topics <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </AppShell>
  );
}
