import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const activeProducts = await prisma.product.count({ where: { isActive: true } });
  const liveCatalogue = await prisma.catalogueItem.count({ where: { status: 'LIVE' } });
  
  console.log('Active Products:', activeProducts);
  console.log('Live Catalogue Items:', liveCatalogue);
  
  const sampleProduct = await prisma.product.findFirst({ where: { isActive: true } });
  console.log('Sample Product:', sampleProduct?.name);
}

check().catch(console.error).finally(() => prisma.$disconnect());
