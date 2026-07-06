import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subjectCatalog } from "@/lib/data/catalog";

export default function SubjectsPage() {
  return (
    <AppShell activeHref="/subjects">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Subjects</h1>
          <p className="mt-1 text-muted-foreground">Topic pools with Easy, Medium, Hard, and Expert progression.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {subjectCatalog.map((subject) => (
            <Card key={subject.slug}>
              <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-5 flex flex-wrap gap-2">
                  {subject.topics.slice(0, 9).map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/subjects/${subject.slug}`}>
                    Open Topics
                    <ArrowRight className="h-4 w-4" />
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
