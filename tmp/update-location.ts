import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating business settings to Eldoret...");
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {
      city: "Eldoret",
      county: "Uasin Gishu County",
      tagline: "Printing the Future, Made in Kenya",
      address1: "Eldoret CBD",
      address2: "Uasin Gishu",
    },
    create: {
      id: "default",
      businessName: "PrintHub",
      tradingName: "PrintHub (An Ezana Group Company)",
      tagline: "Printing the Future, Made in Kenya",
      website: "printhub.africa",
      primaryEmail: "hello@printhub.africa",
      supportEmail: "support@printhub.africa",
      financeEmail: "finance@printhub.africa",
      city: "Eldoret",
      county: "Uasin Gishu County",
      country: "Kenya",
      address1: "Eldoret CBD",
      address2: "Uasin Gishu",
    },
  });
  console.log("Business settings updated successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
