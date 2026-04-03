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

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

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
        query GetModel($id: ID!) {
          model(id: $id) {
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
        headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
        body: JSON.stringify({ query, variables: { id: modelId } }),
      });
      
      if (res.ok) {
        const json = await res.json();
        const model = json.data?.model;
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
  const token = process.env.THINGIVERSE_TOKEN;

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
  const objectId = url.match(/\/object\/(\d+)/)?.[1] || url.match(/-(\d+)$/)?.[1];
  
  if (objectId) {
    try {
      const res = await fetch(`https://www.myminifactory.com/api/v2/objects/${objectId}`, {
        headers: { "User-Agent": USER_AGENT }
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

async function scrapeUnknown(url: string, data: ScrapedModelData): Promise<ScrapedModelData> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return data;
    
    const html = await res.text();
    
    // OG Tags
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1];
    const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i)?.[1];
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1];
    const ogImages = [...html.matchAll(/<meta\s+property="og:image"\s+content="([^"]*)"/gi)].map(m => m[1]);

    // JSON-LD
    let jsonLd: any = null;
    const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try { jsonLd = JSON.parse(jsonLdMatch[1]); } catch {}
    }

    const name = ogTitle || jsonLd?.name || null;
    const description = ogDesc || jsonLd?.description || null;
    const images = ogImages.length > 0 ? ogImages : (ogImage ? [ogImage] : []);
    if (jsonLd?.image) {
      if (Array.isArray(jsonLd.image)) images.push(...jsonLd.image);
      else images.push(jsonLd.image);
    }

    return {
      ...data,
      originalName: decodeHtml(name),
      originalDescription: decodeHtml(description),
      imageUrls: [...new Set(images)].filter(Boolean),
      designerName: jsonLd?.author?.name || jsonLd?.creator?.name || null,
      licenseType: jsonLd?.license || null,
    };
  } catch (e) {
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
