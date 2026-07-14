import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 1. Ensure user exists in Prisma
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email, name: user.name || user.email.split("@")[0] }
    });

    // 2. Fetch up to 20 random questions from DB
    const questions = await prisma.question.findMany({
      take: 20,
      select: { id: true }
    });

    if (questions.length === 0) {
      // If DB is completely empty (no questions generated/seeded yet),
      // we'll return a redirect with a query param or redirect to subjects
      // to let the user practice and auto-generate questions first.
      const url = new URL("/subjects", request.url);
      url.searchParams.set("error", "No questions available. Please practice a topic first to generate questions.");
      return NextResponse.redirect(url, { status: 303 });
    }

    // 3. Create the test
    const test = await prisma.test.create({
      data: {
        title: `Practice Mock Test #${Math.floor(100 + Math.random() * 900)}`,
        mode: "MOCK",
        timeLimitSec: questions.length * 60, // 1 min per question
        totalQuestions: questions.length
      }
    });

    // 4. Create the test-question mappings
    const testQuestionsData = questions.map((q, idx) => ({
      testId: test.id,
      questionId: q.id,
      order: idx + 1
    }));

    await prisma.testQuestion.createMany({
      data: testQuestionsData
    });

    // 5. Redirect to the test runner
    const redirectUrl = new URL(`/mock-tests/${test.id}`, request.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error("Failed to generate mock test:", error);
    const redirectUrl = new URL("/mock-tests", request.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }
}
