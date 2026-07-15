import { NextResponse } from "next/server";
import { startStoredAttempt } from "@/lib/tcs-nqt-store";
import { tcsVariantSchema } from "@/lib/validation";
import { getServerUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = tcsVariantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await startStoredAttempt(user.id, parsed.data.variant);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}

