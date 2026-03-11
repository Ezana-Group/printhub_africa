import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { AccountShell } from "@/components/account/AccountShell";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-account-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-account-heading",
  display: "swap",
});

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className={`${plusJakarta.variable} ${fraunces.variable} account-area min-h-full`}>
      <AccountShell>{children}</AccountShell>
    </div>
  );
}
