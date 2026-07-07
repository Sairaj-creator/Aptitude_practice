import { NextResponse } from "next/server";
import { runCodingSamples } from "@/lib/tcs-nqt";
import { codingRunSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = codingRunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const sampleResult = await runCodingSamples(parsed.data.code, parsed.data.language);
    return NextResponse.json({
      ...sampleResult,
      submitted: true
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
