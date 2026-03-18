import { prisma } from "@/lib/prisma";
import { getAuthPanelForPublic } from "@/lib/auth-panel";
import { AuthPage } from "@/components/auth/auth-page";

// Avoid prerender at build time (no DB in build env); render at request time.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const panel = await getAuthPanelForPublic(prisma);
  return (
    <AuthPage
      initialTab="login"
      panel={panel}
      socialProviders={{
        google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        facebook: !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET,
      }}
    />
  );
}
