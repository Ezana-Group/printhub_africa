import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { AccountShell } from "@/components/account/AccountShell";
import { prisma } from "@/lib/prisma";

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

  let quotedCount = 0;
  try {
    const userId = session.user?.id as string;
    const userEmail = (session.user?.email as string) ?? "";
    const linked = await prisma.quote.count({
      where: { customerId: userId, status: "quoted" },
    });
    const guestOnly = userEmail
      ? await prisma.quote.count({
          where: {
            customerId: null,
            customerEmail: { equals: userEmail, mode: "insensitive" },
            status: "quoted",
          },
        })
      : 0;
    quotedCount = linked + guestOnly;
  } catch {
    // ignore
  }

  return (
    <div className={`${plusJakarta.variable} ${fraunces.variable} account-area min-h-full`}>
      <AccountShell quotedCount={quotedCount}>{children}</AccountShell>
    </div>
  );
}
