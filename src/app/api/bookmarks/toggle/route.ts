import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { questionId } = await request.json() as { questionId: string };
    if (!questionId) return NextResponse.json({ error: "Missing questionId" }, { status: 400 });

    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email, name: user.name || user.email.split("@")[0] }
    });

    const existing = await prisma.bookmark.findUnique({
      where: { userId_questionId: { userId: user.id, questionId } }
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { userId: user.id, questionId } });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Bookmark toggle error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
