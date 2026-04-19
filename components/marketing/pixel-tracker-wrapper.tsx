import { getCachedBusinessPublic } from "@/lib/cache/unstable-cache";
import { PixelTracker } from "./PixelTracker";

/** 
 * Server-side wrapper to fetch business settings and pass to PixelTracker.
 * This keeps the main layout clean and handles data fetching safely.
 */
export async function PixelTrackerWrapper() {
  try {
    const business = await getCachedBusinessPublic();
    return <PixelTracker ga4Id={business?.ga4MeasurementId} />;
  } catch (error) {
    console.error("Error in PixelTrackerWrapper:", error);
    return <PixelTracker />;
  }
}
