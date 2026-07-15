import { NextResponse } from "next/server";
import { listStoredAttempts } from "@/lib/tcs-nqt-store";
import { getServerUser } from "@/lib/auth-server";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only return this user's attempts
  const attempts = await listStoredAttempts(user.id);
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
