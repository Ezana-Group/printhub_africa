import { APIRequestContext } from "@playwright/test";

type QuoteType = "large_format" | "3d_print" | "design_and_print";

const CUSTOMER_EMAIL = "customer@printhub.africa";

/**
 * Create a quote via API. Request context must be from a browser that is logged in as customer
 * (so cookies are sent). Alternatively use a storageState that has customer session.
 * Returns { quoteId, quoteNumber } or null on failure.
 */
export async function createTestQuote(
  request: APIRequestContext,
  type: QuoteType,
  overrides: Partial<{
    customerName: string;
    customerEmail: string;
    projectName: string;
    description: string;
    specifications: Record<string, unknown>;
  }> = {}
): Promise<{ quoteId: string; quoteNumber: string } | null> {
  const body: Record<string, unknown> = {
    type,
    customerName: overrides.customerName ?? "E2E Test Customer",
    customerEmail: overrides.customerEmail ?? CUSTOMER_EMAIL,
    projectName: overrides.projectName ?? `E2E ${type} ${Date.now()}`,
    description: overrides.description ?? "E2E test quote description for automation.",
    ...(overrides.specifications && { specifications: overrides.specifications }),
  };
  if (type === "design_and_print") {
    body.description = (overrides.description ?? body.description) as string;
    if ((body.description as string).length < 20) {
      body.description = "E2E design and print idea description with enough characters.";
    }
  }
  const res = await request.post("/api/quotes", { data: body });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  if (!data.quoteId || !data.quoteNumber) return null;
  return { quoteId: data.quoteId, quoteNumber: data.quoteNumber };
}
