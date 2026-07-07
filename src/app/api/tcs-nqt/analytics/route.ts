import { NextResponse } from "next/server";
import { listStoredAttempts } from "@/lib/tcs-nqt-store";

export async function GET() {
  const attempts = await listStoredAttempts();
  return NextResponse.json({
    attempts,
    trend: attempts.map((attempt, index) => ({
      attempt: index + 1,
      score: attempt.overallScore ?? 0,
      completedAt: attempt.completedAt
    })),
    cutoffBenchmarks: {
      foundation: 65,
      advanced: 70
    }
  });
}
