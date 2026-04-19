import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { canAccessRoute } from "@/lib/admin-permissions";
import { AdminCatalogueBatchClient } from "./admin-catalogue-batch-client";

export default async function AdminCatalogueBatchEnhancePage() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role ?? "";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];

  if (!canAccessRoute("/admin/catalogue/ai-enhance-batch", role, permissions)) {
    redirect("/admin/access-denied");
  }

  // Find products without AI descriptions
  const products = await prisma.product.findMany({
    where: { 
      aiDescriptionGenerated: false,
      isActive: true
    },
    include: {
      category: { select: { name: true } },
      externalModel: { select: { sourceUrl: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <AdminCatalogueBatchClient 
      initialProducts={JSON.parse(JSON.stringify(products))}
    />
  );
}
