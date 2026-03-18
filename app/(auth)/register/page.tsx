import { prisma } from "@/lib/prisma";
import { getAuthPanelForPublic } from "@/lib/auth-panel";
import { AuthPage } from "@/components/auth/auth-page";

export default async function RegisterPage() {
  const panel = await getAuthPanelForPublic(prisma);
  return <AuthPage initialTab="register" panel={panel} />;
}
