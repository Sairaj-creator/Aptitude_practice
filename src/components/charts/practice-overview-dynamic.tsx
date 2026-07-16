"use client";

import dynamic from "next/dynamic";

export const PracticeOverviewChart = dynamic(
  () => import("./practice-overview").then((mod) => mod.PracticeOverviewChart),
  { ssr: false, loading: () => <div className="h-72 rounded-lg border border-border bg-card p-4 flex items-center justify-center text-muted-foreground animate-pulse">Loading charts...</div> }
);
