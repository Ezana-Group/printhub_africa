import { prisma } from "@/lib/prisma";
export * from "./email-templates-constants";

/** Get template by slug. Returns null if not found or subject/body empty (use fallback). */
export async function getEmailTemplate(slug: string): Promise<{
  subject: string;
  bodyHtml: string;
} | null> {
  const t = await prisma.emailTemplate.findUnique({ where: { slug } });
  if (!t || !t.subject.trim() || !t.bodyHtml.trim()) return null;
  return { subject: t.subject, bodyHtml: t.bodyHtml };
}
