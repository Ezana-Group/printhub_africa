import { prisma } from "../lib/prisma";

const KENYA_ZONES = [
  {
    name: "Nairobi Metro",
    counties: "Nairobi",
    feeKes: 250,
    minDays: 1,
    maxDays: 2,
    sortOrder: 1,
  },
  {
    name: "Central Region",
    counties: "Kiambu, Kirinyaga, Murang'a, Nyandarua, Nyeri",
    feeKes: 400,
    minDays: 2,
    maxDays: 3,
    sortOrder: 2,
  },
  {
    name: "Rift Valley North & South",
    counties: "Baringo, Bomet, Elgeyo-Marakwet, Kajiado, Kericho, Laikipia, Nakuru, Nandi, Narok, Samburu, Trans-Nzoia, Turkana, Uasin Gishu, West Pokot",
    feeKes: 500,
    minDays: 2,
    maxDays: 4,
    sortOrder: 3,
  },
  {
    name: "Coast Region",
    counties: "Kilifi, Kwale, Lamu, Mombasa, Taita-Taveta, Tana River",
    feeKes: 600,
    minDays: 2,
    maxDays: 5,
    sortOrder: 4,
  },
  {
    name: "Eastern Region",
    counties: "Embu, Isiolo, Kitui, Machakos, Makueni, Marsabit, Meru, Tharaka-Nithi",
    feeKes: 450,
    minDays: 2,
    maxDays: 4,
    sortOrder: 5,
  },
  {
    name: "Nyanza Region",
    counties: "Homa Bay, Kisii, Kisumu, Migori, Nyamira, Siaya",
    feeKes: 550,
    minDays: 3,
    maxDays: 5,
    sortOrder: 6,
  },
  {
    name: "Western Region",
    counties: "Bungoma, Busia, Kakamega, Vihiga",
    feeKes: 550,
    minDays: 3,
    maxDays: 5,
    sortOrder: 7,
  },
  {
    name: "North Eastern Border",
    counties: "Garissa, Mandera, Wajir",
    feeKes: 850,
    minDays: 4,
    maxDays: 7,
    sortOrder: 8,
  }
];

async function main() {
  console.log("Seeding delivery zones...");
  for (const zone of KENYA_ZONES) {
    await prisma.deliveryZone.upsert({
      where: { id: zone.name.toLowerCase().replace(/\s+/g, '-') },
      update: { ...zone, isActive: true },
      create: { id: zone.name.toLowerCase().replace(/\s+/g, '-'), ...zone, isActive: true },
    });
    console.log(`- ${zone.name}`);
  }
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
