import { prisma } from "@/lib/prisma";

/** Generate next quote number PHQ-00001, PHQ-00002, ... */
export async function generateQuoteNumber(): Promise<string> {
  const last = await prisma.quote.findFirst({
    orderBy: { createdAt: "desc" },
    select: { quoteNumber: true },
  });
  const num = last
    ? parseInt(last.quoteNumber.replace(/^PHQ-0*/, ""), 10) + 1
    : 1;
  return `PHQ-${num.toString().padStart(5, "0")}`;
}

export const QUOTE_TYPE_API_TO_DB = {
  large_format: "large_format",
  "3d_print": "three_d_print",
  design_and_print: "design_and_print",
} as const;

export const QUOTE_TYPE_DB_TO_API = {
  large_format: "large_format",
  three_d_print: "3d_print",
  design_and_print: "design_and_print",
} as const;
