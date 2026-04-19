import { prisma } from "@/lib/prisma";
import { trackBackInStock } from "./klaviyo";
import { waBackInStock } from "./whatsapp";

/**
 * detectBackInStock - Compares old and new stock and triggers notifications if restocked.
 */
export async function detectBackInStock(
  productId: string,
  oldStock: number | null,
  newStock: number | null
) {
  // Only trigger if old stock was 0 (or null/empty) and new stock is > 0
  const isRestocked = (oldStock === null || oldStock <= 0) && (newStock !== null && newStock > 0);

  if (isRestocked) {
    console.log(`[Back-In-Stock] Product ${productId} restocked. Triggering notifications...`);
    await triggerBackInStockNotifications(productId);
  }
}

/**
 * triggerBackInStockNotifications - Finds all subscribers and sends alerts.
 */
export async function triggerBackInStockNotifications(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true },
  });

  if (!product) return;
 
  // @ts-ignore
  const notifications = await prisma.stockNotification.findMany({
    where: { 
      productId, 
      notifiedAt: null 
    },
  });
 
  if (notifications.length === 0) return;
 
  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop/${product.slug}`;
 
  for (const notification of notifications) {
    try {
      if (notification.email) {
        await trackBackInStock(notification.email, product);
      }
      if (notification.phone) {
        await waBackInStock(notification.phone, product.name, productUrl);
      }
 
      // Mark as notified
      // @ts-ignore
      await prisma.stockNotification.update({
        where: { id: notification.id },
        data: { notifiedAt: new Date() },
      });
    } catch (error) {
      console.error(`[Back-In-Stock] Error notifying ${notification.email || notification.phone}:`, error);
    }
  }
}
