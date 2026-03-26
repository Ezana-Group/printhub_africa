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
  rawData?: Record<string, unknown>;
}

export type ImportResult = ExtractedModelData | { error: string; detail?: string; status?: number };


export function detectPlatform(url: string): ImportPlatform {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    if (domain.includes("printables.com")) return "PRINTABLES";
    if (domain.includes("cults3d.com")) return "CULTS3D";
    if (domain.includes("creazilla.com")) return "CREAZILLA";
    if (domain.includes("thingiverse.com")) return "THINGIVERSE";
    if (domain.includes("myminifactory.com")) return "MYMINIFACTORY";
    if (domain.includes("thangs.com")) return "THANGS";
    if (domain.includes("cgtrader.com")) return "CGTRADER";
  } catch {}
  return "OTHER";
}

export async function downloadAndUploadImage(imageUrl: string): Promise<string | null> {
  try {
    // [External] API — updated to use header auth + error handling
    const res = await fetch(imageUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://www.thingiverse.com/"
      },
    });
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

export async function parseUrlImport(url: string): Promise<ImportResult> {
  try {
    const platform = detectPlatform(url);
    
    // 1. Dispatch to dedicated API handlers if available
    if (platform === "PRINTABLES") {
      const match = url.match(/\/model\/(\d+)/);
      if (match?.[1]) return await fetchPrintablesData(match[1], url);
    }
    
    if (platform === "THINGIVERSE") {
      const match = url.match(/thing:(\d+)/) || url.match(/\/thing:(\d+)/) || url.match(/\/(\d+)/);
      if (match?.[1]) return await fetchThingiverseData(match[1], url);
    }

    if (platform === "MYMINIFACTORY") {
      const match = url.match(/\/object\/(\d+)/) || url.match(/-(\d+)$/);
      if (match?.[1]) return await fetchMyMiniFactoryData(match[1], url);
    }

    // 2. If platform has no API but we support manual fallback pre-fill
    if (["CULTS3D", "CREAZILLA", "THANGS", "CGTRADER", "OTHER"].includes(platform)) {
      return { error: "AUTO_IMPORT_NOT_SUPPORTED", detail: `Auto-import is not available for ${platform}. Please use manual entry.` };
    }

    // 3. Generic Fallback (Scraping) - Only if we really want to keep it as a last resort
    // But per instructions, we should prioritize specific errors
    return { error: "AUTO_IMPORT_FAILED", detail: "Could not extract data automatically." };

  } catch (error: unknown) {
    console.error("URL Import Parsing Error:", error);
    return { error: "UNKNOWN_ERROR", detail: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchPrintablesData(modelId: string, sourceUrl: string): Promise<ImportResult> {
  try {
    const query = `
      query getPrint($id: String!) {
        print(id: $id) {
          name
          summary
          description
          printSettings
          licence {
            name
          }
          user {
            publicUsername
          }
          images {
            filePath
          }
          tags {
            name
          }
        }
      }
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://api.printables.com/graphql/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({ query, variables: { id: modelId } }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return { error: "API_FETCH_FAILED", detail: `Printables GraphQL error: ${res.status}`, status: res.status };
    
    const json = await res.json();
    const data = json.data?.print;
    if (!data) return { error: "DATA_NOT_FOUND", detail: "Printables did not return model data." };

    const images = (data.images || []).map((img: { filePath?: string }) => img.filePath).filter(Boolean);
    
    return {
      name: data.name || "",
      description: data.summary || data.description || "",
      thumbnailUrl: images[0] || "",
      imageUrls: images.slice(0, 20) as string[],
      printInfo: data.printSettings || "",
      licenceType: data.licence?.name || "Unknown",
      designerName: data.user?.publicUsername || "Unknown",
      designerUrl: `https://www.printables.com/@${data.user?.publicUsername || ""}`,
      tags: (data.tags || []).map((t: { name: string }) => t.name).filter(Boolean),
      platform: "PRINTABLES",
      sourceUrl,
      externalId: modelId,
    };
  } catch (e) {
    return { error: "API_FETCH_FAILED", detail: String(e) };
  }
}

async function fetchThingiverseData(thingId: string, sourceUrl: string): Promise<ImportResult> {
  try {
    const token = process.env.THINGIVERSE_ACCESS_TOKEN || process.env.THINGIVERSE_APP_TOKEN;
    if (!token) return { error: "API_CONFIG_MISSING", detail: "THINGIVERSE_ACCESS_TOKEN not set." };

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Referer': 'https://www.thingiverse.com/'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const thingRes = await fetch(`https://api.thingiverse.com/things/${thingId}`, { 
      headers,
      signal: controller.signal
    });

    if (!thingRes.ok) {
      clearTimeout(timeoutId);
      const status = thingRes.status;
      if (status === 401 || status === 403) return { error: "API_AUTH_FAILED", detail: "Thingiverse authentication failed.", status: 403 };
      if (status === 429) return { error: "RATE_LIMITED", detail: "Thingiverse rate limit exceeded.", status: 429 };
      if (status >= 500) return { error: "EXTERNAL_SERVICE_DOWN", detail: `Thingiverse service error: ${status}`, status: 503 };
      return { error: "API_FETCH_FAILED", detail: `Thingiverse API error: ${status}`, status };
    }
    
    const thing = await thingRes.json();
    
    // Thingiverse images are usually in thing.images
    const imagesRes = await fetch(`https://api.thingiverse.com/things/${thingId}/images`, { 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const images = imagesRes.ok ? await imagesRes.json() : [];

    return {
      name: thing.name || "",
      description: (thing.description || "").replace(/<[^>]*>?/gm, ""),
      thumbnailUrl: thing.thumbnail || "",
      imageUrls: images.map((img: { url: string; sizes?: { type: string; size: string; url: string }[] }) => img.sizes?.find((s: { type: string; size: string; url: string }) => s.type === "display" && s.size === "large")?.url || img.url).filter(Boolean),
      printInfo: (thing.details || "") + "\n" + (thing.instructions || ""),
      licenceType: thing.license || "Unknown",
      designerName: thing.creator?.name || "Unknown",
      designerUrl: thing.creator?.public_url || "",
      tags: (thing.tags || []).map((t: { name: string }) => t.name).filter(Boolean),
      platform: "THINGIVERSE",
      sourceUrl,
      externalId: thingId,
    };
  } catch (e) {
    return { error: "API_FETCH_FAILED", detail: String(e) };
  }
}

async function fetchMyMiniFactoryData(objectId: string, sourceUrl: string): Promise<ImportResult> {
  try {
    const apiKey = process.env.MYMINIFACTORY_API_KEY;
    const bearer = process.env.MMF_CLIENT_ID;
    
    if (!apiKey && !bearer) {
      return { error: "API_CONFIG_MISSING", detail: "MYMINIFACTORY_API_KEY or MMF_CLIENT_ID not set." };
    }

    let url = `https://www.myminifactory.com/api/v2/objects/${objectId}`;
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    };

    if (apiKey) {
      url += `?key=${apiKey}`;
    } else if (bearer) {
      headers['Authorization'] = `Bearer ${bearer}`;
    }

    // MyMiniFactory v2 API
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const status = res.status;
      if (status === 401 || status === 403) return { error: "API_AUTH_FAILED", detail: "MyMiniFactory authentication failed.", status: 403 };
      if (status === 429) return { error: "RATE_LIMITED", detail: "MyMiniFactory rate limit exceeded.", status: 429 };
      if (status >= 500) return { error: "EXTERNAL_SERVICE_DOWN", detail: `MMF service error: ${status}`, status: 503 };
      return { error: "API_FETCH_FAILED", detail: `MMF API error: ${status}`, status };
    }
    
    const item = await res.json();

    return {
      name: item.name || "",
      description: item.description || "",
      thumbnailUrl: item.thumbnail?.url || "",
      imageUrls: (item.images || []).map((img: { url: string; original?: { url: string } }) => img.original?.url || img.url) || [],
      printInfo: item.print_settings || "",
      licenceType: item.licence?.name || "Proprietary",
      designerName: item.designer?.name || "Unknown",
      designerUrl: item.designer?.profile_url || "",
      tags: item.tags || [],
      platform: "MYMINIFACTORY",
      sourceUrl,
      externalId: objectId,
    };
  } catch (e) {
    return { error: "API_FETCH_FAILED", detail: String(e) };
  }
}

export async function searchThingiverse(term: string, page: number = 1) {
  const url = `https://api.thingiverse.com/search/${encodeURIComponent(term)}?license=cc&type=thing&per_page=20&page=${page}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(url, { 
      headers: { 
        'Authorization': `Bearer ${process.env.THINGIVERSE_ACCESS_TOKEN || process.env.THINGIVERSE_APP_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.thingiverse.com/'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status === 403 || res.status === 401) {
      throw new Error("THINGIVERSE_AUTH_FAILED");
    }

    if (res.status === 429) {
      throw new Error("THINGIVERSE_RATE_LIMITED");
    }

    if (res.status === 503 || res.status === 504) {
      throw new Error("THINGIVERSE_SERVICE_UNAVAILABLE");
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Thingiverse] API error ${res.status}:`, errorText);
      throw new Error(`THINGIVERSE_API_ERROR_${res.status}`);
    }

    const data = await res.json();
    const results = [];

    for (const thing of data.hits || []) {
      const license = thing.license || "";
      if (/nc|non-commercial|noncommercial/i.test(license)) continue;

      results.push({
        externalId: thing.id.toString(),
        name: thing.name,
        description: thing.description || "",
        thumbnailUrl: thing.thumbnail,
        licenceType: license,
        designerName: thing.creator?.name || "Unknown",
        designerUrl: thing.creator?.public_url || "",
        sourceUrl: thing.public_url || `https://www.thingiverse.com/thing:${thing.id}`,
        platform: "THINGIVERSE" as ImportPlatform,
        rawData: thing,
        alreadyImported: false,
      });
    }

    return results;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("THINGIVERSE_TIMEOUT");
    }
    throw error;
  }
}

export async function searchMyMiniFactory(term: string, page: number = 1) {
  const apiKey = process.env.MYMINIFACTORY_API_KEY;
  const bearer = process.env.MMF_CLIENT_ID;
  
  if (!apiKey && !bearer) throw new Error("MMF_API_CONFIG_MISSING");

  let url = `https://www.myminifactory.com/api/v2/search?q=${encodeURIComponent(term)}&commercial_use=1&per_page=20&page=${page}`;
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  };

  if (apiKey) {
    url += `&key=${apiKey}`;
  } else if (bearer) {
    headers['Authorization'] = `Bearer ${bearer}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(url, { 
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.status === 403 || res.status === 401) {
      throw new Error("MMF_AUTH_FAILED");
    }

    if (res.status === 429) {
      throw new Error("MMF_RATE_LIMITED");
    }

    if (res.status === 503 || res.status === 504) {
      throw new Error("MMF_SERVICE_UNAVAILABLE");
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[MyMiniFactory] API error ${res.status}:`, errorText);
      throw new Error(`MMF_API_ERROR_${res.status}`);
    }

    const data = await res.json();
    const results = [];

    for (const item of data.items || []) {
      if (item.licence?.allows_commercial_printing !== true) continue;

      results.push({
        externalId: item.id.toString(),
        name: item.name,
        description: item.description,
        printInfo: item.print_settings || "",
        imageUrls: item.images?.map((img: { url: string; original?: { url: string } }) => img.original?.url || img.url) || [],
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
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("MMF_TIMEOUT");
    }
    throw error;
  }
}
