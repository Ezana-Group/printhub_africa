import * as dotenv from "dotenv";
dotenv.config();

const runTest = async () => {
  const { scrapeModelSource } = await import("../lib/catalogue-scraper.js");
  const { downloadAndUploadImage } = await import("../lib/import-utils.js");

  const urls = [
    "https://www.printables.com/model/417638-parkside-battery-holder",
    "https://makerworld.com/en/models/21262",
    "https://www.thingiverse.com/thing:4176380"
  ];

  for (const url of urls) {
    console.log("\n-------------------------------------------");
    console.log(`Testing scrape for ${url}...`);
    
    try {
      const data = await scrapeModelSource(url);
      console.log("Platform:", data.platform);
      console.log("Scraped Name:", data.originalName);
      console.log("Image URLs count:", data.imageUrls.length);
      
      if (data.imageUrls.length > 0) {
        console.log("First image URL:", data.imageUrls[0]);
        console.log("Testing re-host...");
        const newUrl = await downloadAndUploadImage(data.imageUrls[0]);
        console.log("Re-hosted URL:", newUrl);
        
        const publicUrl = process.env.R2_PUBLIC_URL || "";
        if (newUrl && (newUrl.includes("r2.dev") || (publicUrl && newUrl.includes(publicUrl)))) {
          console.log("✅ Success: Image re-hosted to R2.");
        } else {
          console.log("❌ Failure: Image re-hosting failed.");
        }
      }
    } catch (err) {
      console.error("Test error:", err);
    }
  }
};

runTest();
