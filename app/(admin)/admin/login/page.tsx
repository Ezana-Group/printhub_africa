import { Suspense } from "react";
import { AdminAuthPage } from "@/components/auth/admin-auth-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Login | PrintHub Africa",
  description: "Secure access for PrintHub staff and administrators.",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AdminAuthPage />
    </Suspense>
  );
}
