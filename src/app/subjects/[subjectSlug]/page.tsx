import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSubject, topicSlug } from "@/lib/data/catalog";
import { notFound } from "next/navigation";

export default async function SubjectDetailPage({ params }: { params: Promise<{ subjectSlug: string }> }) {
  const { subjectSlug } = await params;
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
          {subject.topics.map((topic, index) => (
            <Card key={topic}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{topic}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Easy unlocked</div>
                  </div>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/subjects/${subject.slug}/${topicSlug(topic)}/practice`} aria-label={`Practice ${topic}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="mt-4">
                  <Progress value={(index * 17) % 100} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
