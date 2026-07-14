import { PrismaClient } from "@prisma/client";
import { subjectCatalog, companyConfigs } from "../src/lib/data/catalog";
import { tcsNqtPattern } from "../src/lib/data/tcs-nqt";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Subjects and Topics
  for (const subjectData of subjectCatalog) {
    const subject = await prisma.subject.upsert({
      where: { slug: subjectData.slug },
      update: { name: subjectData.name },
      create: { name: subjectData.name, slug: subjectData.slug }
    });

    for (const topicName of subjectData.topics) {
      const slug = slugify(topicName);
      await prisma.topic.upsert({
        where: { subjectId_slug: { subjectId: subject.id, slug } },
        update: { name: topicName },
        create: { subjectId: subject.id, name: topicName, slug }
      });
    }

    console.log(`✓ Subject: ${subjectData.name} (${subjectData.topics.length} topics)`);
  }

  // 2. Company test configs
  for (const config of companyConfigs) {
    await prisma.companyTestConfig.upsert({
      where: { companyName: config.companyName },
      update: { totalQuestions: config.totalQuestions, timeLimitSec: config.timeLimitSec },
      create: {
        companyName: config.companyName,
        topicWeights: {},
        totalQuestions: config.totalQuestions,
        timeLimitSec: config.timeLimitSec
      }
    });
  }
  console.log(`✓ ${companyConfigs.length} company configs seeded`);

  // 3. TCS NQT sections
  for (const section of tcsNqtPattern) {
    await prisma.tcsNqtSection.upsert({
      where: { slug: section.id },
      update: {
        name: section.name,
        category: section.category as "FOUNDATION" | "ADVANCED" | "CODING",
        questionCount: section.questionCount,
        timeLimitSec: section.timeLimitSec,
        order: section.order
      },
      create: {
        slug: section.id,
        name: section.name,
        category: section.category as "FOUNDATION" | "ADVANCED" | "CODING",
        questionCount: section.questionCount,
        timeLimitSec: section.timeLimitSec,
        order: section.order
      }
    });
  }
  console.log(`✓ ${tcsNqtPattern.length} TCS NQT sections seeded`);

  // 4. ExamPatternConfig for TCS NQT (admin-editable)
  await prisma.examPatternConfig.upsert({
    where: { id: "tcs-nqt-default" },
    update: {},
    create: {
      id: "tcs-nqt-default",
      exam: "TCS_NQT",
      version: "2024",
      config: tcsNqtPattern,
      isActive: true
    }
  });
  console.log("✓ ExamPatternConfig seeded");

  console.log("\n🎉 Seed complete! Run /api/questions/generate to populate questions via Groq AI.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
