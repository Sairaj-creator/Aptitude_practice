import { NextResponse } from "next/server";
import { submitStoredSection } from "@/lib/tcs-nqt-store";
import { tcsSectionSubmissionSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string; sectionId: string }> }) {
  const { id, sectionId } = await context.params;
  const body = await request.json();
  const parsed = tcsSectionSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = submitStoredSection(id, sectionId, parsed.data.answers, parsed.data.timeTakenSec);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
