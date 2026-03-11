import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { CookieBanner } from "@/components/CookieBanner";
import { getBusinessPublic } from "@/lib/business-public";

// Always fetch fresh business data so saved contact/WhatsApp shows immediately
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getBusinessPublic();
  return (
    <>
      <AnnouncementBar business={business} />
      <Header business={business} />
      <main id="main-content" className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer business={business} />
      <WhatsAppFloat whatsapp={business.whatsapp} />
      <CookieBanner />
    </>
  );
}
