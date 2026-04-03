import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log("🌱 Seeding mock reviews for social proof...");

  // 1. Create or find a mock reviewer user
  const mockUser = await prisma.user.upsert({
    where: { email: "reviewer@printhub.africa" },
    update: {},
    create: {
      email: "reviewer@printhub.africa",
      name: "Verified Customer",
    }
  });

  // 2. Find some products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 5,
  });

  if (products.length === 0) {
    console.log("❌ No products found to seed reviews for.");
    return;
  }

  const reviewers = [
    { title: "Great!", rating: 5, comment: "Excellent quality and fast delivery! Highly recommended." },
    { title: "Good quality", rating: 4, comment: "Great service, but the packaging could be better." },
    { title: "Amazing", rating: 5, comment: "Best printing service in Nairobi. Professional and helpful." },
    { title: "Detailed", rating: 5, comment: "The 3D prints are incredibly detailed. Will order again!" },
    { title: "Stunning", rating: 5, comment: "Perfect for our corporate event. The banners were stunning." },
    { title: "Worth it", rating: 4, comment: "Good quality, worth the price." },
    { title: "Impressive", rating: 5, comment: "Very impressed with the attention to detail." },
  ];

  for (const product of products) {
    console.log(`📝 Adding reviews for: ${product.name}`);
    
    // Add 2-7 reviews per product to trigger "Bestseller" (need > 5 for some)
    const count = Math.floor(Math.random() * 6) + 3; 
    
    for (let i = 0; i < count; i++) {
        const rev = reviewers[Math.floor(Math.random() * reviewers.length)];
        await prisma.productReview.create({
            data: {
                productId: product.id,
                userId: mockUser.id,
                rating: rev.rating,
                body: rev.comment,
                title: rev.title,
                isApproved: true,
                isVerified: true,
            }
        });
    }
  }

  console.log("✅ Mock reviews seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
