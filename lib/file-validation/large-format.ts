/**
 * Large-format print file validation (images): DPI, dimensions, format.
 * Uses sharp for image metadata.
 */

import sharp from "sharp";

const MIN_DPI = 72;
const RECOMMENDED_DPI = 150;
const MAX_DIMENSION_PX = 50_000;

export interface LargeFormatValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    widthPx: number;
    heightPx: number;
    dpiX?: number;
    dpiY?: number;
    format: string;
  };
}

export async function validateLargeFormatImage(
  buffer: Buffer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API consistency
  _filename: string
): Promise<LargeFormatValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const meta = await sharp(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const density = meta.density ?? 0;
    const format = meta.format ?? "unknown";

    const dpiX = meta.density ?? 0;
    const dpiY = meta.density ?? 0;

    if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
      errors.push(`Image dimensions too large (max ${MAX_DIMENSION_PX}px per side).`);
    }
    if (width < 100 || height < 100) {
      warnings.push("Image is very small; may appear pixelated when printed large.");
    }
    if (density > 0 && density < MIN_DPI) {
      errors.push(`DPI (${density}) is below minimum ${MIN_DPI} for print.`);
    } else if (density > 0 && density < RECOMMENDED_DPI) {
      warnings.push(`DPI (${density}) is below recommended ${RECOMMENDED_DPI} for best quality.`);
    }
    if (density === 0 || density === 72) {
      warnings.push("No print DPI set (or 72 DPI). For large format we recommend 150+ DPI.");
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      metadata: {
        widthPx: width,
        heightPx: height,
        dpiX: dpiX || undefined,
        dpiY: dpiY || undefined,
        format: String(format),
      },
    };
  } catch (e) {
    return {
      ok: false,
      errors: [e instanceof Error ? e.message : "Could not read image metadata"],
      warnings: [],
    };
  }
}
