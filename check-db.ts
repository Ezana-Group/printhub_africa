import { PrismaClient } from "@prisma/client";

async function check() {
  const prisma = new PrismaClient();
  try {
    const categories = await prisma.category.findMany();
    console.log("CATEGORIES_COUNT:", categories.length);
    console.log("CATEGORIES_ACTIVE:", categories.filter(c => c.isActive).length);
    if (categories.length > 0) {
      console.log("SAMPLE_CATEGORY:", JSON.stringify(categories[0]));
    }

    const seo = await prisma.seoSettings.findUnique({ where: { id: "default" } });
    console.log("SEO_SETTINGS_FOUND:", !!seo);
    if (seo) {
      console.log("SEO_DATA:", JSON.stringify(seo));
    }
  } catch (e) {
    console.error("CHECK_ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
