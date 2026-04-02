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
  
  try {
    const fetchPromise = fetch(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon,status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === "success") {
          return {
            country: data.country || null,
            city: data.city || null,
            lat: data.lat || null,
            lon: data.lon || null,
          };
        }
        return null;
      });

    const timeoutPromise = new Promise<{
      country: string | null;
      city: string | null;
      lat: number | null;
      lon: number | null;
    } | null>((resolve) => setTimeout(() => resolve(null), 2000));

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    return null;
  }
}
