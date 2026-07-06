import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <AppShell activeHref="/profile">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Student identity, target companies, and preparation preferences.</CardContent>
      </Card>
    </AppShell>
  );
}
