export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-slate-900">Profile Settings</h1>
      <p className="text-slate-600 mt-1">Update your name, email, and password.</p>
      <Link href="/account" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to account</Link>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-slate-500">Name</dt>
            <dd className="text-slate-900">{session.user?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd className="text-slate-900">{session.user?.email ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-slate-500">To change your password, use the link sent to your email (Forgot password on login page).</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link href="/">Home</Link>
        </Button>
      </div>
      </div>
    </div>
  );
}
