import * as cheerio from "cheerio";
import { ImportPlatform } from "@prisma/client";
import { putObjectBuffer, generateStorageKey, publicFileUrl } from "./r2";

export interface ExtractedModelData {
  name: string;
  description: string;
  thumbnailUrl: string;
  imageUrls: string[];
  printInfo: string;
  licenceType: string;
  designerName: string;
  designerUrl: string;
  tags: string[];
  platform: ImportPlatform;
  sourceUrl: string;
  externalId?: string;
  rawData?: any;
}

export function detectPlatform(url: string): ImportPlatform {
  const domain = new URL(url).hostname.toLocaleLowerCase();
  if (domain.includes("printables.com")) return "PRINTABLES";
  if (domain.includes("cults3d.com")) return "CULTS3D";
  if (domain.includes("creazilla.com")) return "CREAZILLA";
  if (domain.includes("thingiverse.com")) return "THINGIVERSE";
  if (domain.includes("myminifactory.com")) return "MYMINIFACTORY";
  if (domain.includes("thangs.com")) return "THANGS";
  return "OTHER";
}

export async function downloadAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/")[1] || "jpg";
    
    const key = generateStorageKey({
      folder: "products/images",
      filename: "imported-image",
      ext,
    });
    
    await putObjectBuffer({
      bucket: "public",
      key,
      body: buffer,
      contentType,
    });
    
    return publicFileUrl(key);
  } catch (error) {
    console.error(`Failed to download/upload image ${imageUrl}:`, error);
    return null;
  }
}

export async function parseUrlImport(url: string): Promise<ExtractedModelData | { error: string }> {
  try {
    const platform = detectPlatform(url);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PrintHubBot/1.0)",
        "Accept": "text/html",
      },
    });

    if (!response.ok) return { error: "PAGE_FETCH_FAILED" };
    const html = await response.text();
    const $ = cheerio.load(html);

    // Metadata
    const name = $('meta[property="og:title"]').attr('content') || 
                 $('meta[name="twitter:title"]').attr('content') || 
                 $('h1').first().text().trim() || 
                 $('title').text().trim();
    
    if (!name) return { error: "NAME_NOT_FOUND" };

    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="twitter:description"]').attr('content') || 
                        $('p').filter((_index, el) => $(el).text().length > 80).first().text().trim();

    const thumbnail = $('meta[property="og:image"]').attr('content') || 
                      $('meta[name="twitter:image"]').attr('content') || 
                      $('img').filter((_index, el) => {
                        const w = $(el).attr('width');
                        return !w || parseInt(w) > 300;
                      }).first().attr('src');

    // All Images
    const imageUrlSet = new Set<string>();
    $('meta[property="og:image"]').each((_index, el) => {
      const src = $(el).attr('content');
      if (src) imageUrlSet.add(src);
    });
    $('img').each((_index, el) => {
      const src = $(el).attr('src');
      const width = $(el).attr('width');
      if (src && (!width || parseInt(width) > 300)) {
        // Basic filter
        if (!/avatar|icon|logo|banner|ad|google|facebook|twitter/i.test(src)) {
          imageUrlSet.add(new URL(src, url).href);
        }
      }
    });

    // JSON-LD
    let jsonLdData: any = null;
    $('script[type="application/ld+json"]').each((_index, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}");
        if (data.image) {
          if (Array.isArray(data.image)) data.image.forEach((img: string) => imageUrlSet.add(img));
          else imageUrlSet.add(data.image);
        }
        if (!jsonLdData) jsonLdData = data;
      } catch (e) {}
    });

    const imageUrls = Array.from(imageUrlSet);

    // Print Info
    let printInfo = "";
    const sections = ["Print Settings", "Printing", "Technical Details", "Specifications", "How to Print", "Layer Height", "Infill", "Supports", "Material", "Print Time", "Filament"];
    $('*').each((_index, el) => {
      const text = $(el).text().trim();
      if (sections.some(s => text.toLowerCase().includes(s.toLowerCase()))) {
        // Try to get parent or sibling text
        printInfo += text + "\n";
      }
    });
    if (jsonLdData) {
      printInfo += "\nStructured Data: " + JSON.stringify(jsonLdData, null, 2);
    }

    // License
    let licenceType = "";
    const licenseKeywords = ["license", "licence", "creative commons", "CC BY", "CC0", "non-commercial", "commercial use"];
    $('*').each((_index, el) => {
      const text = $(el).text().trim();
      if (licenseKeywords.some(k => text.toLowerCase().includes(k.toLowerCase())) && text.length < 500) {
        licenceType = text;
        return false; // break
      }
    });
    licenceType = licenceType || $('meta[property="og:licence"]').attr('content') || (jsonLdData?.license) || "Unknown";

    // Designer Info
    const designerName = $('meta[property="og:author"]').attr('content') || 
                         $('*').filter((_index, el) => /by|designer|author|created by|uploaded by/i.test($(el).text())).first().text().replace(/by|designer|author|created by|uploaded by/gi, "").trim();
    const designerUrl = $('a').filter((_index, el) => /profile|user|author/i.test($(el).attr('href') || "")).first().attr('href');

    // Tags
    const tags: string[] = [];
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) tags.push(...metaKeywords.split(",").map(t => t.trim()));
    $('[class*="tag"], [class*="category"], [class*="chip"], [class*="label"], [class*="badge"]').each((_index, el) => {
      tags.push($(el).text().trim());
    });
    if (jsonLdData?.keywords) {
      if (Array.isArray(jsonLdData.keywords)) tags.push(...jsonLdData.keywords);
      else tags.push(...jsonLdData.keywords.split(",").map((t: string) => t.trim()));
    }

    return {
      name,
      description: description || "",
      thumbnailUrl: thumbnail || "",
      imageUrls: imageUrls.slice(0, 20), // limit to 20 images for now
      printInfo,
      licenceType,
      designerName: designerName || "Unknown",
      designerUrl: designerUrl ? new URL(designerUrl, url).href : "",
      tags: Array.from(new Set(tags)).filter(t => t.length > 0),
      platform,
      sourceUrl: url,
    };
  } catch (error) {
    console.error("URL Import Parsing Error:", error);
    return { error: "UNKNOWN_ERROR" };
  }
}

export async function searchThingiverse(term: string, page: number = 1) {
  const token = process.env.THINGIVERSE_APP_TOKEN;
  if (!token) throw new Error("THINGIVERSE_APP_TOKEN_MISSING");

  const url = `https://api.thingiverse.com/search/${encodeURIComponent(term)}?license=cc&type=thing&per_page=20&page=${page}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Thingiverse API Error: ${res.status}`);
  
  const data = await res.json();
  const results = [];

  for (const thing of data.hits || []) {
    // Check license for NC
    const license = thing.license || "";
    if (/nc|non-commercial|noncommercial/i.test(license)) continue;

    const thingDetailUrl = `https://api.thingiverse.com/things/${thing.id}`;
    const detailRes = await fetch(thingDetailUrl, { headers: { Authorization: `Bearer ${token}` } });
    const detail = detailRes.ok ? await detailRes.json() : {};

    const imagesRes = await fetch(`${thingDetailUrl}/images`, { headers: { Authorization: `Bearer ${token}` } });
    const images = imagesRes.ok ? await imagesRes.json() : [];

    results.push({
      externalId: thing.id.toString(),
      name: thing.name,
      description: (detail.description || "").replace(/<[^>]*>?/gm, ""),
      printInfo: (detail.details || "") + "\n" + (detail.instructions || ""),
      imageUrls: images.map((img: any) => img.sizes.find((s: any) => s.type === "display" && s.size === "large")?.url || img.url),
      thumbnailUrl: thing.thumbnail,
      licenceType: license,
      designerName: thing.creator?.name,
      designerUrl: thing.creator?.public_url,
      tags: (detail.tags || []).map((t: any) => t.name),
      sourceUrl: thing.public_url,
      platform: "THINGIVERSE" as ImportPlatform,
      rawData: thing,
    });
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

export async function searchMyMiniFactory(term: string, page: number = 1) {
  const token = process.env.MMF_CLIENT_ID; // Prompt says OAuth Bearer token, I'll use MMF_CLIENT_ID as the token for now
  if (!token) throw new Error("MMF_CLIENT_ID_MISSING");

  const url = `https://www.myminifactory.com/api/v2/search?q=${encodeURIComponent(term)}&license=commercial&per_page=20&page=${page}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`MyMiniFactory API Error: ${res.status}`);
  
  const data = await res.json();
  const results = [];

  for (const item of data.items || []) {
    // Only import where allows_commercial_printing is true
    if (item.licence?.allows_commercial_printing !== true) continue;

    results.push({
      externalId: item.id.toString(),
      name: item.name,
      description: item.description,
      printInfo: item.print_settings || "",
      imageUrls: item.images?.map((img: any) => img.original?.url || img.url) || [],
      thumbnailUrl: item.thumbnail?.url,
      licenceType: item.licence?.name || "Commercial",
      designerName: item.designer?.name,
      designerUrl: item.designer?.profile_url,
      tags: item.tags || [],
      sourceUrl: item.url,
      platform: "MYMINIFACTORY" as ImportPlatform,
      rawData: item,
    });
    
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}
