import { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login | PrintHub",
  description: "Secure staff authentication portal",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
            Staff Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your PrintHub credentials
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
