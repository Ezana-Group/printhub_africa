export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; id?: string }>;
}) {
  try {

  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/admin");
  const { token, id } = await searchParams;
  if (!token || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Invalid or missing invite link</h1>
          <p className="mt-2 text-muted-foreground">Use the link from your invitation email.</p>
        </div>
      </div>
    );
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, status: true, inviteToken: true, inviteTokenExpiry: true },
  });
  if (!user || user.status !== "INVITE_PENDING" || !user.inviteToken || !user.inviteTokenExpiry) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Invite expired or invalid</h1>
          <p className="mt-2 text-muted-foreground">Request a new invitation from your admin.</p>
        </div>
      </div>
    );
  }
  if (user.inviteTokenExpiry < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Invitation expired</h1>
          <p className="mt-2 text-muted-foreground">This link has expired. Request a new one.</p>
        </div>
      </div>
    );
  }
  const valid = await bcrypt.compare(token, user.inviteToken);
  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Invalid invite link</h1>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AcceptInviteForm userId={user.id} token={token} email={user.email} name={user.name ?? ""} />
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
