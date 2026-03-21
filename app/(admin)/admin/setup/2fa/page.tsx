import { Metadata } from "next";
import { Setup2FAForm } from "@/components/admin/auth/Setup2FAForm";
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Setup 2FA | PrintHub Staff",
};

export default async function AdminSetup2FAPage() {
  const session = await getServerSession(adminAuthOptions);
  
  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      adminTwoFactorEnabled: true,
      adminTwoFactorGraceEndsAt: true,
    }
  });

  if (user?.adminTwoFactorEnabled) {
    redirect("/admin/dashboard");
  }

  const inGracePeriod = user?.adminTwoFactorGraceEndsAt && user.adminTwoFactorGraceEndsAt > new Date();

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Secure your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Two-factor authentication is required for all staff accounts.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <Setup2FAForm inGracePeriod={!!inGracePeriod} />
        </div>
      </div>
    </div>
  );
}
