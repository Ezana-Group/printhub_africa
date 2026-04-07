import { detectPlatform as existingDetectPlatform } from "./import-utils";

export interface ScrapedModelData {
  platform: 'printables' | 'thingiverse' | 'myminifactory' | 'cults3d' | 'unknown'
  originalName: string | null
  originalDescription: string | null
  originalTags: string[]
  originalCategory: string | null
  imageUrls: string[]
  designerName: string | null
  licenseType: string | null
  downloadCount: number | null
  likeCount: number | null
  remixCount: number | null
  sourceUrl: string
}

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function scrapeModelSource(url: string): Promise<ScrapedModelData> {
  const platform = detectPlatform(url);
  
  const baseData: ScrapedModelData = {
    platform,
    originalName: null,
    originalDescription: null,
    originalTags: [],
    originalCategory: null,
    imageUrls: [],
    designerName: null,
    licenseType: null,
    downloadCount: null,
    likeCount: null,
    remixCount: null,
    sourceUrl: url,
  };

  try {
    switch (platform) {
      case 'printables':
        return await scrapePrintables(url, baseData);
      case 'thingiverse':
        return await scrapeThingiverse(url, baseData);
      case 'myminifactory':
        return await scrapeMyMiniFactory(url, baseData);
      case 'cults3d':
        return await scrapeCults3d(url, baseData);
      default:
        return await scrapeUnknown(url, baseData);
    }
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${url}:`, error);
    return baseData;
  }
}

function detectPlatform(url: string): ScrapedModelData['platform'] {
  const domain = new URL(url).hostname.toLowerCase();
  if (domain.includes("printables.com")) return "printables";
  if (domain.includes("thingiverse.com")) return "thingiverse";
  if (domain.includes("myminifactory.com")) return "myminifactory";
  if (domain.includes("cults3d.com")) return "cults3d";
  return "unknown";
}

async function scrapePrintables(url: string, data: ScrapedModelData): Promise<ScrapedModelData> {
  const modelId = url.match(/\/model\/(\d+)/)?.[1];
  
  if (modelId) {
    try {
      const query = `
        query GetPrint($id: ID!) {
          print(id: $id) {
            id
            name
            summary
            description
            tags { name }
            license { name }
            user { publicUsername }
            category { name }
            images { filePath }
            likesCount
            makes { id }
          }
        }
      `;
      
      const res = await fetch("https://api.printables.com/graphql/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "User-Agent": USER_AGENT,
          "Referer": "https://www.printables.com/"
        },
        body: JSON.stringify({ query, variables: { id: modelId } }),
      });
      
      if (res.ok) {
        const json = await res.json();
        const model = json.data?.print;
        if (model) {
          return {
            ...data,
            originalName: model.name,
            originalDescription: model.description || model.summary,
            originalTags: model.tags?.map((t: any) => t.name) || [],
            originalCategory: model.category?.name,
            imageUrls: model.images?.map((img: any) => img.filePath).filter(Boolean) || [],
            designerName: model.user?.publicUsername,
            licenseType: model.license?.name,
            likeCount: model.likesCount,
            remixCount: model.makes?.length || 0,
          };
        }
      }
    } catch (e) {
      console.warn("[Scraper] Printables GraphQL failed, falling back to HTML", e);
    }
  }

  // Fallback to HTML scraping
  return await scrapeUnknown(url, data);
}

async function scrapeThingiverse(url: string, data: ScrapedModelData): Promise<ScrapedModelData> {
  const thingId = url.match(/\/thing:(\d+)/)?.[1] || url.match(/\/(\d+)/)?.[1];
  const token = process.env.THINGIVERSE_APP_TOKEN || process.env.THINGIVERSE_TOKEN;

  if (thingId && token) {
    try {
      const headers = { "Authorization": `Bearer ${token}`, "User-Agent": USER_AGENT };
      const [thingRes, imagesRes] = await Promise.all([
        fetch(`https://api.thingiverse.com/things/${thingId}`, { headers }),
        fetch(`https://api.thingiverse.com/things/${thingId}/images`, { headers })
      ]);

      if (thingRes.ok) {
        const thing = await thingRes.json();
        const images = imagesRes.ok ? await imagesRes.json() : [];
        
        return {
          ...data,
          originalName: thing.name,
          originalDescription: thing.description,
          originalTags: thing.tags?.map((t: any) => t.name) || [],
          originalCategory: thing.category?.name || thing.category,
          imageUrls: images.map((img: any) => img.sizes?.find((s: any) => s.type === "display" && s.size === "large")?.url || img.url).filter(Boolean),
          designerName: thing.creator?.name,
          licenseType: thing.license,
          likeCount: thing.like_count,
          downloadCount: thing.download_count,
        };
      }
    } catch (e) {
      console.warn("[Scraper] Thingiverse API failed", e);
    }
  }

  return await scrapeUnknown(url, data);
}

async function scrapeMyMiniFactory(url: string, data: ScrapedModelData): Promise<ScrapedModelData> {
  // Regex for /object/8600 or /object/name-8600
  const objectId = url.match(/\/object\/(\d+)/)?.[1] || url.match(/-(\d+)$/)?.[1] || url.match(/\/(\d+)/)?.[1];
  
  if (objectId) {
    try {
      const res = await fetch(`https://www.myminifactory.com/api/v2/objects/${objectId}`, {
        headers: { 
          "User-Agent": USER_AGENT,
          "Referer": "https://www.myminifactory.com/"
        }
      });
      
      if (res.ok) {
        const item = await res.json();
        return {
          ...data,
          originalName: item.name,
          originalDescription: item.description,
          originalTags: item.tags || [],
          originalCategory: item.category,
          imageUrls: (item.images || []).map((img: any) => img.original?.url || img.url) || [],
          designerName: item.designer?.name,
          licenseType: item.licence?.name,
          likeCount: item.likes_count,
          downloadCount: item.downloads_count,
        };
      }
    } catch (e) {
      console.warn("[Scraper] MyMiniFactory API failed", e);
    }
  }

  return await scrapeUnknown(url, data);
}

async function scrapeCults3d(url: string, data: ScrapedModelData): Promise<ScrapedModelData> {
  // Cults3D is mostly HTML/JSON-LD
  return await scrapeUnknown(url, data);
}

import { load } from "cheerio";

async function scrapeUnknown(url: string, data: ScrapedModelData): Promise<ScrapedModelData> {
  try {
    const res = await fetch(url, { 
      headers: { 
        "User-Agent": USER_AGENT,
        "Referer": "https://www.google.com/" // Use a neutral referer for generic scraping
      } 
    });
    if (!res.ok) return data;
    
    const html = await res.text();
    const $ = load(html);
    
    // 1. Domain Specific Extraction
    if (url.includes("myminifactory.com")) {
      data.originalName = $("h1").first().text().trim();
      data.originalDescription = $(".description").text().trim() || $(".object-description").text().trim();
    } else if (url.includes("cults3d.com")) {
      data.originalName = $("h1").first().text().trim();
      data.originalDescription = $(".field-name-body").text().trim();
    }

    // 2. Generic Metadata Extraction (favors domain-specific if filled)
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="title"]').attr('content') || 
                  $("title").text();
    
    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content');

    if (!data.originalName) data.originalName = decodeHtml(title || null);
    if (!data.originalDescription) data.originalDescription = decodeHtml(description || null);

    // 3. Image Extraction
    const images: string[] = [];
    $('meta[property="og:image"]').each((_, el) => {
      const src = $(el).attr('content');
      if (src) images.push(src);
    });
    
    // JSON-LD fallback for images
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "{}");
        if (json.image) {
          if (Array.isArray(json.image)) images.push(...json.image);
          else images.push(json.image);
        }
      } catch {}
    });

    data.imageUrls = [...new Set([...(data.imageUrls || []), ...images])].filter(Boolean);

    return data;
  } catch (e) {
    console.error("[Scraper] scrapeUnknown failed:", e);
    return data;
  }
}

function decodeHtml(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
