import { NextResponse } from "next/server";
import { submitStoredSection } from "@/lib/tcs-nqt-store";
import { tcsSectionSubmissionSchema } from "@/lib/validation";
import { getServerUser } from "@/lib/auth-server";

export async function POST(request: Request, context: { params: Promise<{ id: string; sectionId: string }> }) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, sectionId } = await context.params;
  const body = await request.json();
  const parsed = tcsSectionSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await submitStoredSection(id, sectionId, parsed.data.answers, parsed.data.timeTakenSec);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
