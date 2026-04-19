import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const zones = [
  {
    name: "Eldoret (Home Base)",
    county: "Uasin Gishu",
    counties: "Uasin Gishu",
    feeKes: 0,
    minDays: 0,
    maxDays: 1,
    sortOrder: 1,
  },
  {
    name: "Nairobi Metro",
    county: "Nairobi",
    counties: "Nairobi, Kiambu, Machakos, Kajiado",
    feeKes: 350,
    minDays: 1,
    maxDays: 2,
    sortOrder: 2,
  },
  {
    name: "Western & Nyanza",
    county: "Kisumu",
    counties: "Kisumu, Kakamega, Bungoma, Busia, Vihiga, Siaya, Homa Bay, Migori, Kisii, Nyamira",
    feeKes: 450,
    minDays: 2,
    maxDays: 3,
    sortOrder: 3,
  },
  {
    name: "Coast Region",
    county: "Mombasa",
    counties: "Mombasa, Kwale, Kilifi, Tana River, Lamu, Taita Taveta",
    feeKes: 600,
    minDays: 3,
    maxDays: 5,
    sortOrder: 4,
  },
  {
    name: "Central & Mount Kenya",
    county: "Nyeri",
    counties: "Nyeri, Kirinyaga, Murang'a, Nyandarua, Meru, Tharaka-Nithi, Embu, Laikipia",
    feeKes: 400,
    minDays: 2,
    maxDays: 3,
    sortOrder: 5,
  },
  {
    name: "Rift Valley (North & South)",
    county: "Nakuru",
    counties: "Nakuru, Kericho, Bomet, Nandi, Trans Nzoia, Elgeyo-Marakwet, West Pokot, Baringo, Samburu, Narok",
    feeKes: 400,
    minDays: 1,
    maxDays: 3,
    sortOrder: 6,
  },
  {
    name: "Northern Kenya (Arid/Remote)",
    county: "Garissa",
    counties: "Garissa, Wajir, Mandera, Marsabit, Isiolo, Turkana",
    feeKes: 1000,
    minDays: 5,
    maxDays: 10,
    sortOrder: 7,
  }
];

async function main() {
  console.log("Seeding delivery zones...");
  
  for (const zone of zones) {
    const existing = await prisma.deliveryZone.findFirst({
      where: { name: zone.name }
    });
    
    if (existing) {
      console.log(`Updating existing zone: ${zone.name}`);
      await prisma.deliveryZone.update({
        where: { id: existing.id },
        data: zone
      });
    } else {
      console.log(`Creating new zone: ${zone.name}`);
      await prisma.deliveryZone.create({
        data: zone
      });
    }
  }
  
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
