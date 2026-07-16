"use client";

import Link from "next/link";

import { ArrowRight, Building2, LineChart, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function LandingHero() {
  return (
    <section className="grid min-h-[calc(100vh-4rem)] items-center gap-10 py-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
          <Building2 className="h-4 w-4 text-primary" />
          TCS NQT dedicated module included
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-foreground sm:text-5xl lg:text-6xl">
          Placement Preparation Platform
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          A focused aptitude, reasoning, verbal, mock-test, analytics, and company-simulation workspace for campus placement preparation.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/company-prep/tcs-nqt">Start TCS NQT</Link>
          </Button>
        </div>
      </div>

      <div
        className="animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both rounded-lg border border-border bg-card p-4 shadow-soft"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Accuracy", "84%", "text-emerald-700"],
            ["Weak Topics", "5", "text-rose-700"],
            ["Mock Rank", "Top 18%", "text-amber-700"]
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-md border border-border bg-background p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className={`mt-2 text-2xl font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-border bg-background p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Mastery Gate</div>
              <div className="text-xs text-muted-foreground">Easy unlocks Medium at 80% after 10 questions</div>
            </div>
            <LineChart className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-4">
            {[
              ["Easy", 100, "Unlocked"],
              ["Medium", 82, "Unlocked"],
              ["Hard", 44, "Locked"],
              ["Expert", 8, "Locked"]
            ].map(([label, value, state]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{state}</span>
                </div>
                <Progress value={Number(value)} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <TimerReset className="h-4 w-4 text-primary" />
              Section Timer
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {["Numerical", "Reasoning", "Verbal"].map((label, index) => (
                <div key={label} className="rounded-sm bg-muted p-2">
                  <div className="font-semibold">{index === 0 ? "40m" : index === 1 ? "50m" : "30m"}</div>
                  <div className="mt-1 text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <div className="text-sm font-semibold">Revision Queue</div>
            <div className="mt-3 space-y-2 text-xs">
              {["Ratio shortcuts", "Syllogism cases", "Subject verb traps"].map((item) => (
                <div key={item} className="rounded-sm bg-muted px-3 py-2 text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
