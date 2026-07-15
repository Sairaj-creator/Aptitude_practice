import { NextResponse } from "next/server";
import { getStoredAttempt } from "@/lib/tcs-nqt-store";
import { getCurrentSection } from "@/lib/tcs-nqt";
import { getServerUser } from "@/lib/auth-server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
