/**
 * Meilisearch search for products (server-side).
 * Env: MEILISEARCH_URL, MEILISEARCH_KEY, ALGOLIA_INDEX_NAME.
 * When Meilisearch is disabled or not configured, callers should fall back to DB search.
 */

import { MeiliSearch } from "meilisearch";

const host = process.env.MEILISEARCH_URL;
const apiKey = process.env.MEILISEARCH_KEY || process.env.MEILI_MASTER_KEY;
const indexName = process.env.ALGOLIA_INDEX_NAME ?? process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "products";

export function isAlgoliaConfigured(): boolean {
  return Boolean(host && apiKey && indexName);
}

export interface AlgoliaSearchProductsResult {
  hits: Array<{ objectID: string }>;
  nbHits: number;
}

/**
 * Search products in Meilisearch. Returns hit objectIDs (product ids) and total count.
 * objectID in the index should be the product id.
 */
export async function searchProducts(
  query: string,
  options?: { page?: number; limit?: number }
): Promise<AlgoliaSearchProductsResult> {
  if (!isAlgoliaConfigured()) return { hits: [], nbHits: 0 };
  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.min(100, Math.max(1, options?.limit ?? 12));

  try {
    const client = new MeiliSearch({ host: host!, apiKey: apiKey! });
    const index = client.index(indexName);

    const res = await index.search(query, {
      hitsPerPage: limit,
      page: page,
      attributesToRetrieve: ["id", "objectID"],
    });

    const hits = res.hits.map((h) => ({ objectID: h.id ?? h.objectID ?? "" }));
    return { hits, nbHits: res.estimatedTotalHits ?? res.totalHits ?? 0 };
  } catch (e) {
    console.error("Meilisearch search error:", e);
    return { hits: [], nbHits: 0 };
  }
}

/**
 * Push products to Meilisearch index.
 */
export async function indexProducts(products: any[]) {
  if (!isAlgoliaConfigured()) return;
  const client = new MeiliSearch({ host: host!, apiKey: apiKey! });
  const index = client.index(indexName);

  try {
    const records = products.map((p) => ({
      id: p.id,
      objectID: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription,
      images: p.images,
      basePrice: Number(p.basePrice),
      isFeatured: p.isFeatured,
      isActive: p.isActive,
      category: p.category?.name,
      brand: p.brand,
      tags: p.tags,
      updatedAt: p.updatedAt,
    }));

    await index.addDocuments(records, { primaryKey: "id" });
  } catch (e) {
    console.error("Meilisearch indexing error:", e);
    throw e;
  }
}
