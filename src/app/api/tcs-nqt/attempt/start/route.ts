import { NextResponse } from "next/server";
import { startStoredAttempt } from "@/lib/tcs-nqt-store";
import { tcsVariantSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = tcsVariantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = startStoredAttempt("demo-user", parsed.data.variant);
  return NextResponse.json(result);
}
