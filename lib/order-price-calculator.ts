import { prisma } from './prisma';

interface CartItem {
  productId?: string;
  variantId?: string;
  quantity: number;
}

interface PriceResult {
  items: { 
    productId?: string; 
    variantId?: string; 
    quantity: number; 
    unitPrice: number; 
    lineTotal: number 
  }[];
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  vatAmount: number;
  total: number;
  loyaltyDiscountKes: number;
  corporateDiscountKes: number;
}

/**
 * Recalculates order prices entirely server-side.
 * Client-supplied monetary values are ignored to prevent price manipulation.
 */
export async function calculateOrderPriceServerSide(
  cartItems: CartItem[],
  couponCode: string | null,
  deliveryMethod: string,
  userId?: string,
  options?: {
    loyaltyPoints?: number;
    corporateId?: string | null;
  }
): Promise<PriceResult> {
  // 1. Fetch all product/variant prices from DB — never trust client
  const items = await Promise.all(
    cartItems.map(async (item) => {
      let unitPrice: number;

      if (item.variantId) {
        const variant = await prisma.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
          select: { price: true, stock: true },
        });
        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${item.variantId}`);
        }
        unitPrice = Number(variant.price);
      } else if (item.productId) {
        const product = await prisma.product.findUniqueOrThrow({
          where: { id: item.productId },
          select: { basePrice: true, stock: true },
        });
        if (product.stock !== null && product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
        unitPrice = Number(product.basePrice);
      } else {
        throw new Error('Cart item must have productId or variantId');
      }

      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    })
  );

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  // 2. Validate coupon server-side
  let couponDiscountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        expiryDate: { gte: new Date() },
      },
    });
    if (coupon) {
      if (coupon.maxUses !== null) {
        const usageCount = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
        if (usageCount >= coupon.maxUses) {
          throw new Error('Coupon usage limit reached');
        }
      }
      if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
        throw new Error(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
      }
      couponDiscountAmount = coupon.type === 'PERCENTAGE'
        ? Math.round(subtotal * (Number(coupon.value) / 100))
        : Number(coupon.value);
    }
  }

  // 3. Corporate Discount
  let corporateDiscountKes = 0;
  if (options?.corporateId && userId) {
    const membership = await prisma.corporateTeamMember.findFirst({
      where: {
        userId,
        corporateId: options.corporateId,
        isActive: true,
        corporate: { status: 'APPROVED' },
      },
      include: { corporate: { select: { discountPercent: true } } },
    });
    if (membership?.corporate) {
      corporateDiscountKes = Math.round(subtotal * (membership.corporate.discountPercent / 100));
    }
  }

  // 4. Loyalty Discount
  let loyaltyDiscountKes = 0;
  if (options?.loyaltyPoints && userId) {
    const loyaltySettings = await prisma.loyaltySettings.findUnique({ where: { id: 'default' } });
    loyaltyDiscountKes = Math.floor(options.loyaltyPoints * (loyaltySettings?.kesPerPointRedeemed ?? 1));
  }

  const discountAmount = couponDiscountAmount + corporateDiscountKes + loyaltyDiscountKes;

  // 5. Calculate delivery fee from DB settings or hardcoded defaults
  const pricingConfigFees = await prisma.pricingConfig.findMany({
    where: { key: { in: ['standardShippingFee', 'expressShippingFee', 'vatRate'] } }
  });
  const feesMap = new Map(pricingConfigFees.map(c => [c.key, c.valueJson]));
  
  const standardFee = feesMap.has('standardShippingFee') ? Number(feesMap.get('standardShippingFee')) : 350;
  const expressFee = feesMap.has('expressShippingFee') ? Number(feesMap.get('expressShippingFee')) : 750;
  const vatRate = feesMap.has('vatRate') ? parseFloat(feesMap.get('vatRate')!) : 0.16;

  const deliveryFee = deliveryMethod === 'PICKUP' ? 0
    : deliveryMethod === 'EXPRESS' ? expressFee
    : standardFee;

  // 6. Calculate VAT from DB config
  const taxableAmount = Math.max(0, subtotal - discountAmount + deliveryFee);
  const vatAmount = Math.round(taxableAmount * vatRate);
  const total = taxableAmount + vatAmount;

  return { 
    items, 
    subtotal, 
    discountAmount, 
    deliveryFee, 
    vatAmount, 
    total,
    loyaltyDiscountKes,
    corporateDiscountKes
  };
}
