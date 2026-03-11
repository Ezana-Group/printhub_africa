/**
 * Sanity.io CMS client (blog, content)
 * Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in env.
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export function getClient() {
  if (!projectId) return null;
  // TODO: import { createClient } from "next-sanity"; return createClient({ projectId, dataset, ... });
  return null;
}

export async function getBlogPosts(limit = 10) {
  const client = getClient();
  if (!client) return [];
  // TODO: client.fetch(groq`*[_type == "post"] | order(publishedAt desc)[0...$limit]{ ... }`, { limit });
  void limit;
  return [];
}
