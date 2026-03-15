/**
 * Algolia search for products (server-side).
 * Env: NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY, ALGOLIA_INDEX_NAME.
 * When Algolia is disabled or not configured, callers should fall back to DB search.
 */

import { algoliasearch } from "algoliasearch";

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
const indexName = process.env.ALGOLIA_INDEX_NAME ?? process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "products";

export function isAlgoliaConfigured(): boolean {
  return Boolean(appId && searchKey && indexName);
}

export interface AlgoliaSearchProductsResult {
  hits: Array<{ objectID: string }>;
  nbHits: number;
}

/**
 * Search products in Algolia. Returns hit objectIDs (product ids) and total count.
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
    const client = algoliasearch(appId!, searchKey!);
    const res = await client.searchSingleIndex<{ objectID?: string }>({
      indexName,
      searchParams: {
        query,
        page: page - 1,
        hitsPerPage: limit,
        attributesToRetrieve: ["objectID"],
      },
    });
    const hits = (res.hits ?? []).map((h) => ({ objectID: h.objectID ?? "" }));
    return { hits, nbHits: res.nbHits ?? 0 };
  } catch (e) {
    console.error("Algolia search error:", e);
    return { hits: [], nbHits: 0 };
  }
}
