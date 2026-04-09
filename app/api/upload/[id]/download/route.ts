import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import {
  createPresignedDownloadUrl,
  publicFileUrl,
  isR2Configured,
} from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Try both sessions — admin downloads originate from the admin portal (different session cookie)
  const adminSession = await getServerSession(authOptionsAdmin);
  const customerSession = await getServerSession(authOptionsCustomer);
  const session = adminSession?.user?.id ? adminSession : customerSession;
  const { id } = await params;

  const file = await prisma.uploadedFile.findUnique({
    where: { id },
    include: { quote: { select: { customerId: true, customerEmail: true } } },
  });

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 🔴 CRIT-3: Prevent download of unscanned or infected files
  if (file.status === "VIRUS_SCANNING" || file.virusScanStatus === "PENDING") {
    return NextResponse.json({ 
      error: "File is currently being scanned for viruses. Try again in 30 seconds.",
      code: "SCAN_PENDING"
    }, { status: 423 });
  }

  if (file.status === "INFECTED" || file.virusScanStatus === "infected") {
    return NextResponse.json({ 
      error: "Access denied. This file has been flagged as malicious and cannot be downloaded.",
      code: "FILE_INFECTED"
    }, { status: 403 });
  }

  const isOwner = file.userId === session?.user?.id;
  const role = (session?.user as { role?: string })?.role ?? "";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF";

  // Allow access if file belongs to a quote owned by this customer (or guest email)
  const isQuoteOwner =
    file.quote &&
    session?.user &&
    (file.quote.customerId === session.user.id ||
      (file.quote.customerId === null &&
        session.user.email &&
        file.quote.customerEmail?.toLowerCase() ===
          (session.user.email as string).toLowerCase()));

  if (!isOwner && !isAdmin && !isQuoteOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const wantRedirect = req.nextUrl.searchParams.get("redirect") === "1";

  if (file.bucket === "public" && file.storageKey) {
    const publicUrl = publicFileUrl(file.storageKey);
    if (wantRedirect) return NextResponse.redirect(publicUrl);
    return NextResponse.json({ url: publicUrl, expiresIn: null });
  }

  if (!file.storageKey || !isR2Configured()) {
    return NextResponse.json(
      { error: "File or storage not available" },
      { status: 503 }
    );
  }

  const url = await createPresignedDownloadUrl(file.storageKey, 3600);
  if (wantRedirect) return NextResponse.redirect(url);
  return NextResponse.json({ url, expiresIn: 3600 });
}
