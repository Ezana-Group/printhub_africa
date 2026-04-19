/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      staff: true,
      auditLogs: {
        orderBy: { timestamp: "desc" },
        take: 500,
      },
      assignedEmailThreads: {
        include: {
          emails: {
            orderBy: { sentAt: "asc" },
          },
        },
      },
      emailThreadsCreated: {
        include: {
          emails: {
            orderBy: { sentAt: "asc" },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Also get files uploaded by this user
  const uploadedFiles = await prisma.uploadedFile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Combine threads from both relations
  const allThreads = [
    ...(user as any).assignedEmailThreads,
    ...(user as any).emailThreadsCreated,
  ];

  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.id,
    },
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      personalEmail: user.personalEmail,
      phone: user.phone,
      status: user.status,
      role: user.role,
      joinedAt: user.createdAt,
      staffDetails: (user as any).staff,
    },
    auditLogs: (user as any).auditLogs.map((log: any) => ({
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      timestamp: log.timestamp,
      before: log.before,
      after: log.after,
      ipAddress: log.ipAddress,
    })),
    uploadedFiles: uploadedFiles.map((f: any) => ({
      filename: f.filename,
      originalName: f.originalName,
      url: f.url,
      size: f.size,
      mimeType: f.mimeType,
      createdAt: f.createdAt,
    })),
    emails: allThreads.map((thread: any) => ({
      subject: thread.subject,
      customerEmail: thread.customerEmail,
      status: thread.status,
      emails: thread.emails.map((e: any) => ({
        from: e.fromAddress,
        to: e.toAddress,
        subject: e.subject,
        body: e.bodyHtml,
        sentAt: e.sentAt,
      })),
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="staff_export_${user.email}_${new Date().getTime()}.json"`,
    },
  });
}
