"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TcsNqtVariant } from "@/lib/data/tcs-nqt";

const variants: Array<{ value: TcsNqtVariant; label: string; detail: string }> = [
  { value: "FOUNDATION_ONLY", label: "Foundation", detail: "80 questions" },
  { value: "FOUNDATION_PLUS_ADVANCED", label: "Foundation + Advanced", detail: "132 questions" }
];

export function VariantToggle() {
  const router = useRouter();
  const [variant, setVariant] = useState<TcsNqtVariant>("FOUNDATION_ONLY");
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const response = await fetch("/api/tcs-nqt/attempt/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant })
    });
    const data = await response.json();
    setLoading(false);
    router.push(`/company-prep/tcs-nqt/full-mock?attemptId=${data.attempt.id}`);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {variants.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setVariant(item.value)}
            className={cn(
              "rounded-md border border-border bg-background p-4 text-left transition-colors hover:bg-muted",
              variant === item.value && "border-primary bg-secondary"
            )}
          >
            <div className="font-semibold">{item.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div>
          </button>
        ))}
      </div>
      <Button className="mt-4 w-full" onClick={start} disabled={loading}>
        <Play className="h-4 w-4" />
        {loading ? "Starting" : "Start Full Mock"}
      </Button>
    </div>
  );
}
