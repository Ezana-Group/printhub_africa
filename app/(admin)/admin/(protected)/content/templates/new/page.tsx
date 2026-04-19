import { requireAdminSettings } from "@/lib/auth-guard";
import TemplateCreatorClient from "./template-creator-client";

export default async function NewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdminSettings();
  const { type = "email" } = await searchParams;

  return <TemplateCreatorClient initialType={type as "email" | "whatsapp" | "pdf"} />;
}
