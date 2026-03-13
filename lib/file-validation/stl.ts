/**
 * STL file validation: basic structure check (binary or ASCII).
 */

export interface StlValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    isBinary: boolean;
    numTriangles?: number;
  };
}

export async function validateStl(
  buffer: Buffer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API consistency
  _filename: string
): Promise<StlValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (buffer.length < 84) {
    return { ok: false, errors: ["File too small to be a valid STL"], warnings: [] };
  }

  const isBinary =
    buffer.length >= 84 &&
    !buffer.subarray(0, 5).toString("ascii").startsWith("solid");

  if (isBinary) {
    const numTriangles = buffer.readUInt32LE(80);
    const expectedSize = 84 + numTriangles * 50;
    if (buffer.length < expectedSize) {
      errors.push(`STL truncated: expected ${expectedSize} bytes, got ${buffer.length}`);
    }
    if (numTriangles === 0) {
      warnings.push("STL contains no triangles.");
    }
    if (numTriangles > 10_000_000) {
      warnings.push("Very high triangle count; processing may be slow.");
    }
    return {
      ok: errors.length === 0,
      errors,
      warnings,
      metadata: { isBinary: true, numTriangles },
    };
  }

  // ASCII: rough check
  const text = buffer.subarray(0, Math.min(2000, buffer.length)).toString("utf8");
  if (!text.includes("facet") || !text.includes("vertex")) {
    errors.push("STL does not look like valid ASCII (missing facet/vertex).");
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    metadata: { isBinary: false },
  };
}
