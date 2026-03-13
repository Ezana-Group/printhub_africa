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

function isAsciiStl(buffer: Buffer): boolean {
  const head = buffer.subarray(0, Math.min(80, buffer.length));
  for (let i = 0; i < head.length; i++) {
    const c = head[i];
    if (c < 32 && c !== 9 && c !== 10 && c !== 13) return false;
    if (c > 127) return false;
  }
  return true;
}

export async function validateStl(buffer: Buffer, _filename: string): Promise<StlValidationResult> {
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
