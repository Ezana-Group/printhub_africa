import { prisma } from "@/lib/prisma";

const SYSTEM_SETTINGS_KEY = "adminSettings:system";

type RawSystemSettings = Record<string, unknown>;

export type ServiceFlags = {
  largeFormatEnabled: boolean;
  homeFeaturedColumns: number;
  homeFeaturedRows: number;
  shopGridColumns: number;
  shopGridRows: number;
};

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function parseInteger(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return fallback;
}

export async function getServiceFlags(): Promise<ServiceFlags> {
  try {
    const row = await prisma.pricingConfig.findUnique({
      where: { key: SYSTEM_SETTINGS_KEY },
      select: { valueJson: true },
    });

    if (!row?.valueJson) {
      return {
        largeFormatEnabled: false,
        homeFeaturedColumns: 4,
        homeFeaturedRows: 1,
        shopGridColumns: 3,
        shopGridRows: 3,
      };
    }

    const parsed = JSON.parse(row.valueJson) as RawSystemSettings;
    return {
      largeFormatEnabled: parseBoolean(
        parsed.featureFlag_Large_Format_Printing,
        false
      ),
      homeFeaturedColumns: parseInteger(parsed.homeFeaturedColumns, 4),
      homeFeaturedRows: parseInteger(parsed.homeFeaturedRows, 1),
      shopGridColumns: parseInteger(parsed.shopGridColumns, 3),
      shopGridRows: parseInteger(parsed.shopGridRows, 3),
    };
  } catch (error) {
    // Build-time and cold-start environments may not have DB connectivity.
    // Default to safe layout settings until settings can be loaded.
    console.warn("[service-flags] Falling back to defaults:", error);
    return {
      largeFormatEnabled: false,
      homeFeaturedColumns: 4,
      homeFeaturedRows: 1,
      shopGridColumns: 3,
      shopGridRows: 3,
    };
  }
}
