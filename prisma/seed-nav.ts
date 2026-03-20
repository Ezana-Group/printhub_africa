import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in environment.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding navigation items...");

  // Clear existing to avoid duplicates if re-run
  try {
    await prisma.navigationItem.deleteMany();
  } catch (e) {
    console.log("No existing navigation items to delete or table doesn't exist yet.");
  }

  // Top level items
  const items = [
    { label: "Home", href: "/", sortOrder: 0 },
    { label: "About Us", href: "/about", sortOrder: 1 },
    { label: "Services", href: "/services", sortOrder: 2, children: [
      { label: "All Services", href: "/services", sortOrder: 0 },
      { label: "Large Format Printing", href: "/services/large-format-printing", sortOrder: 1 },
      { label: "3D Printing", href: "/services/3d-printing", sortOrder: 2 },
      { label: "Corporate Orders", href: "/get-a-quote", sortOrder: 3 },
    ]},
    { label: "Shop", href: "/shop", sortOrder: 3, children: [
      { label: "All Products", href: "/shop", sortOrder: 0 },
      { label: "Print-on-Demand Catalogue", href: "/catalogue", sortOrder: 1 },
      { label: "New Arrivals", href: "/shop?sort=newest", sortOrder: 2 },
      { label: "Best Sellers", href: "/shop?sort=bestselling", sortOrder: 3 },
    ]},
    { label: "Get a Quote", href: "/get-a-quote", sortOrder: 4 },
  ];

  for (const item of items) {
    const { children, ...data } = item;
    const created = await prisma.navigationItem.create({
      data: {
        ...data,
        isActive: true,
      }
    });

    if (children) {
      for (const child of children) {
        await prisma.navigationItem.create({
          data: {
            ...child,
            parentId: created.id,
            isActive: true,
          }
        });
      }
    }
  }

  console.log("Navigation seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
