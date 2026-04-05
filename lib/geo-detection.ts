import { captureException } from "@sentry/nextjs";

export async function getLocationFromIp(ip: string): Promise<{
  country: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
} | null> {
  if (
    ["127.0.0.1", "::1", "localhost"].includes(ip) || 
    ip.startsWith("192.168.") || 
    ip.startsWith("10.") ||
    ip.startsWith("172.") // Simplified local check
  ) {
    return null;
  }
  
  const timeoutMs = 2000;
  
  try {
    const fetchPromise = fetch(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon,status`)
      .then((res) => {
        if (!res.ok) throw new Error(`IP-API HTTP error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.status === "success") {
          return {
            country: data.country || null,
            city: data.city || null,
            lat: data.lat || null,
            lon: data.lon || null,
          };
        }
        throw new Error(`IP-API invalid response: ${JSON.stringify(data)}`);
      });

    const timeoutPromise = new Promise<{
      country: string | null;
      city: string | null;
      lat: number | null;
      lon: number | null;
    }>((_, reject) => setTimeout(() => reject(new Error("Geo-detection timeout")), timeoutMs));

    // 🔴 HIGH-3: Geo Detection Fallback & Timeout
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err: any) {
    // Log to Sentry unless it's just our intentional timeout giving up
    if (err.message !== "Geo-detection timeout") {
      console.error(`[GeoDetection] Error resolving IP ${ip}:`, err);
      captureException(err, { tags: { ip, service: "ip-api" } });
    } else {
      console.warn(`[GeoDetection] Timeout resolving IP ${ip} after ${timeoutMs}ms`);
    }
    // Fail open safely so logins are not blocked
    return null;
  }
}
