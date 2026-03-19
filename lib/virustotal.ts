/**
 * VirusTotal API v3 — file scan.
 * Uploads file to VT, waits for analysis, returns clean/infected.
 * Files > 32MB are not sent (VT direct upload limit); we mark as "error" or skip.
 */

const VT_BASE = "https://www.virustotal.com/api/v3";
const VT_MAX_FILE_BYTES = 32 * 1024 * 1024; // 32MB

export type VirusTotalResult =
  | { status: "clean" }
  | { status: "infected"; malicious: number }
  | { status: "error"; message: string }
  | { status: "skipped"; reason: string };

/**
 * Scan a file buffer with VirusTotal. Returns result or error.
 * Call only when VIRUSTOTAL_API_KEY is set.
 */
export async function scanFile(
  buffer: Buffer,
  filename: string,
  apiKey: string
): Promise<VirusTotalResult> {
  if (buffer.length > VT_MAX_FILE_BYTES) {
    return { status: "skipped", reason: "File exceeds 32MB VirusTotal limit" };
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), filename);

  let res: Response;
  try {
    res = await fetch(`${VT_BASE}/files`, {
      method: "POST",
      headers: { "x-apikey": apiKey },
      body: form,
    });
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Network error" };
  }

  if (!res.ok) {
    const text = await res.text();
    return { status: "error", message: `VirusTotal API ${res.status}: ${text.slice(0, 200)}` };
  }

  let data: { data?: { type?: string; id?: string } };
  try {
    data = await res.json();
  } catch {
    return { status: "error", message: "Invalid VirusTotal response" };
  }

  const fileId = data.data?.id;
  if (!fileId) {
    return { status: "error", message: "No file ID in VirusTotal response" };
  }

  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const fileRes = await fetch(`${VT_BASE}/files/${fileId}`, {
      headers: { "x-apikey": apiKey },
    });
    if (!fileRes.ok) continue;
    const fileData = await fileRes.json();
    const stats = fileData.data?.attributes?.last_analysis_stats;
    if (stats && typeof stats === "object") {
      const malicious = typeof stats.malicious === "number" ? stats.malicious : 0;
      if (malicious > 0) {
        return { status: "infected", malicious };
      }
      return { status: "clean" };
    }
  }

  return { status: "error", message: "VirusTotal analysis timed out" };
}
