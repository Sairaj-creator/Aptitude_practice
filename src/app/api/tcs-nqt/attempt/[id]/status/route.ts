import { NextResponse } from "next/server";
import { getStoredAttempt } from "@/lib/tcs-nqt-store";
import { getCurrentSection } from "@/lib/tcs-nqt";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const attempt = await getStoredAttempt(id);

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  return NextResponse.json({
    attempt,
    currentSection: getCurrentSection(attempt)
  });
}
