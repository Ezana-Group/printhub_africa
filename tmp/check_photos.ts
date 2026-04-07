
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const anomalies = await prisma.catalogueItemPhoto.findMany({
    where: {
      url: {
        contains: 'cm' // Search for CUID-like urls
      }
    },
    select: { id: true, url: true }
  });

  console.log('Photos with CUID-like URLs:', anomalies);
  
  const matches = anomalies.filter(a => a.id === a.url);
  console.log('Photos where URL == ID:', matches);
}

main().catch(console.error);
