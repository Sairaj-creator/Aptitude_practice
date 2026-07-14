import { prisma } from "@/lib/prisma";

async function testPrisma() {
  try {
    // Test basic Prisma connection
    const userCount = await prisma.user.count();
    console.log(`Prisma is working! Found ${userCount} users in database.`);
    return true;
  } catch (error) {
    console.error("Prisma test failed:", error);
    return false;
  }
}

testPrisma();