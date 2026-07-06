import { NextResponse } from "next/server";
import { runCodingSamples } from "@/lib/tcs-nqt";
import { codingRunSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = codingRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sampleResult = runCodingSamples(parsed.data.code, parsed.data.language);
  return NextResponse.json({
    ...sampleResult,
    submitted: true
  });
}
