import { prisma } from "@/lib/prisma";

const SYSTEM_SETTINGS_KEY = "adminSettings:system";

type RawSystemSettings = Record<string, unknown>;

export type ServiceFlags = {
  largeFormatEnabled: boolean;
};

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
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
      return { largeFormatEnabled: false };
    }

    const parsed = JSON.parse(row.valueJson) as RawSystemSettings;
    return {
      largeFormatEnabled: parseBoolean(
        parsed.featureFlag_Large_Format_Printing,
        false
      ),
    };
  } catch (error) {
    // Build-time and cold-start environments may not have DB connectivity.
    // Default to hiding large format until settings can be loaded safely.
    console.warn("[service-flags] Falling back to defaults:", error);
    return { largeFormatEnabled: false };
  }
}
