import { Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdaptivePage() {
  return (
    <AppShell activeHref="/adaptive">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Adaptive Test Mode</h1>
          <p className="mt-1 text-muted-foreground">Three correct answers increase difficulty. Two wrong answers decrease it.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Live Difficulty State
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {["EASY", "MEDIUM", "HARD", "EXPERT"].map((difficulty, index) => (
              <div key={difficulty} className="rounded-md border border-border p-4">
                <Badge variant={index === 1 ? "success" : "outline"}>{difficulty}</Badge>
                <div className="mt-3 text-sm text-muted-foreground">{index === 1 ? "Current level" : "Available through progression"}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
