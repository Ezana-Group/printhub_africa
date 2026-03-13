import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  User,
  Shield,
  Bell,
  MapPin,
  CreditCard,
  Building2,
  ShieldCheck,
} from "lucide-react";

const CUSTOMER_SETTINGS_NAV = [
  { href: "/account/settings/profile", label: "Profile", icon: User },
  { href: "/account/settings/security", label: "Security", icon: Shield },
  { href: "/account/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/account/settings/corporate", label: "Corporate Account", icon: Building2 },
  { href: "/account/settings/privacy", label: "Privacy & data", icon: ShieldCheck },
];

export default async function CustomerSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-[200px] shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {CUSTOMER_SETTINGS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-foreground hover:text-primary text-sm whitespace-nowrap"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
