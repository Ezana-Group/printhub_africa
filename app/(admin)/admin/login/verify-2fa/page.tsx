import { Metadata } from "next";
import { Verify2FAForm } from "@/components/admin/auth/Verify2FAForm";
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/lib/auth-admin";

export const metadata: Metadata = {
  title: "Verify Identity | PrintHub Staff",
};

export default async function Verify2FAPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const session = await getServerSession(adminAuthOptions);
  const passedEmail = email || session?.user?.email || "";
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify your identity
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the code from your authenticator app.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <Verify2FAForm email={passedEmail} />
        </div>
      </div>
    </div>
  );
}
