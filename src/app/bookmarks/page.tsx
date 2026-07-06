import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookmarksPage() {
  return (
    <AppShell activeHref="/bookmarks">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-normal">Bookmarks and Revision Queue</h1>
        <Card>
          <CardHeader>
            <CardTitle>Due Today</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["Percent change traps", "Seating arrangement", "Preposition errors"].map((item) => (
              <div key={item} className="rounded-md border border-border p-4 text-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
