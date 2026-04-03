export const dynamic = "force-dynamic";

import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import WhatsAppTemplateEditPageClient from "./whatsapp-editor-client";

export default async function WhatsAppEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSettings();
  const { slug } = await params;

  const template = await prisma.whatsAppTemplate.findUnique({
    where: { slug },
  });

  if (!template) notFound();

  return (
    <WhatsAppTemplateEditPageClient 
      template={{
        slug: template.slug,
        name: template.name,
        description: template.description,
        bodyText: template.bodyText,
        category: template.category,
      }} 
    />
  );
}
