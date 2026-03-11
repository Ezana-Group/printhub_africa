/**
 * Algolia search (products, blog)
 * Set NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_INDEX_NAME, ALGOLIA_ADMIN_KEY in env.
 */

export function searchProducts(query: string, filters?: string) {
  if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID) return Promise.resolve({ hits: [] });
  // TODO: use algoliasearch/lite on client or searchClient on server
  void query;
  void filters;
  return Promise.resolve({ hits: [] });
}
