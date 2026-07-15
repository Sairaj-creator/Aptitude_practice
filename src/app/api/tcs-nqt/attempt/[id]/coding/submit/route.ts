import { NextResponse, type NextRequest } from "next/server";
import { runCodingSamples } from "@/lib/tcs-nqt";
import { codingRunSchema } from "@/lib/validation";
import { getServerUser } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Auth check
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 submissions per minute per user
  const rateLimitKey = `coding-submit:${user.id}`;
  const rl = checkRateLimit(rateLimitKey, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();
    const parsed = codingRunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Await params (Next.js 15 async params)
    await context.params;

    const sampleResult = await runCodingSamples(parsed.data.code, parsed.data.language);
    return NextResponse.json({
      ...sampleResult,
      submitted: true
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
