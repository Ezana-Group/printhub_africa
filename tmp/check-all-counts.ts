import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const totalProducts = await prisma.product.count();
  const activeProducts = await prisma.product.count({ where: { isActive: true } });
  
  const totalCatalogue = await prisma.catalogueItem.count();
  const liveCatalogue = await prisma.catalogueItem.count({ where: { status: 'LIVE' } });
  
  console.log('--- PRODUCTS ---');
  console.log('Total:', totalProducts);
  console.log('Active (isActive: true):', activeProducts);
  
  console.log('\n--- CATALOGUE ITEMS ---');
  console.log('Total:', totalCatalogue);
  console.log('Live (status: LIVE):', liveCatalogue);
  
  if (totalProducts > 0) {
    const firstP = await prisma.product.findFirst();
    console.log('\nSample Product Status:', firstP?.name, '| isActive:', firstP?.isActive);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
