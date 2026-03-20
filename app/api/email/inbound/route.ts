import { Webhook } from "svix";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { isR2Configured, putObjectBuffer } from "@/lib/r2";

const EMAIL_SUFFIX = "@printhub.africa";

function normalizeAddress(addr: string) {
  return addr.trim().toLowerCase();
}

function extractEmail(from: string): { name: string | null; email: string | null } {
  const raw = from.trim();
  const match = raw.match(/<([^>]+)>/);
  const email = match?.[1] ? match[1].trim() : raw.split(/\s+/).pop()?.trim() ?? null;
  const name = match ? raw.slice(0, match.index).trim().replace(/^"|"$/g, "") : null;
  return { name: name && name.length ? name : null, email: email ? normalizeAddress(email) : null };
}

function normalizeSubject(subject: string): string {
  const s = (subject ?? "").trim();
  return s.replace(/^(re|fwd|fw)\s*:\s*/i, "").trim();
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function mailboxLabelFromAddress(address: string): string {
  const localPart = address.split("@")[0] ?? address;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type ResendWebhookData = {
  email_id?: string;
  subject?: string;
  from?: string;
  to?: string[];
  message_id?: string | null;
};

type ResendReceivedData = {
  html?: string;
  text?: string | null;
  cc?: string[];
};

type ResendAttachmentMeta = {
  id?: string;
  filename?: string;
  content_type?: string;
  download_url?: string;
  size?: number;
};

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing RESEND_WEBHOOK_SECRET" }, { status: 503 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 503 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: unknown;
  try {
    const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
    event = wh.verify(payload, headers);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // Resend delivers the received email metadata under event.data
  const data = (event as { data?: ResendWebhookData }).data;
  const emailId = data?.email_id;
  const subject = data?.subject ?? "";
  const from = data?.from;
  const to = data?.to ?? [];
  const messageId = data?.message_id ?? null;

  if (!from || !to.length) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  console.log(`[InboundEmail] ID: ${emailId}, From: ${from}, To: ${to.join(", ")}`);

  const toNormalized = to
    .map((addr) => extractEmail(addr).email)
    .filter((a): a is string => !!a && a.endsWith(EMAIL_SUFFIX));
  
  if (toNormalized.length === 0) {
    console.log(`[InboundEmail] Ignored: No recipients matching ${EMAIL_SUFFIX}`);
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Only treat non-user addresses as business inboxes.
  const internalUsers = await prisma.user.findMany({
    where: {
      OR: [{ email: { in: toNormalized } }, { personalEmail: { in: toNormalized } }],
    },
    select: { email: true, personalEmail: true },
  });
  const userAddressSet = new Set<string>();
  for (const u of internalUsers) {
    if (u.email) userAddressSet.add(normalizeAddress(u.email));
    if (u.personalEmail) userAddressSet.add(normalizeAddress(u.personalEmail));
  }
  const businessRecipients = toNormalized.filter((addr) => !userAddressSet.has(addr));
  if (businessRecipients.length === 0) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  let mailbox = await prisma.emailAddress.findFirst({
    where: {
      address: { in: businessRecipients },
      isActive: true,
    },
    select: { id: true, address: true, label: true, isActive: true },
  });

  // If a business mailbox record does not exist yet, auto-create one so threads are visible in admin inbox.
  if (!mailbox) {
    const targetAddress = businessRecipients[0];
    mailbox = await prisma.emailAddress.upsert({
      where: { address: targetAddress },
      update: { isActive: true },
      create: {
        address: targetAddress,
        label: mailboxLabelFromAddress(targetAddress) || "Mailbox",
        isActive: true,
      },
      select: { id: true, address: true, label: true, isActive: true },
    });
  }

  const customer = extractEmail(from);
  if (!customer.email) return NextResponse.json({ success: true }, { status: 200 });

  // Ignore emails sent by internal staff (so business inboxes only show customer/business messages).
  const internalSender = await prisma.user.findFirst({
    where: {
      OR: [{ email: customer.email! }, { personalEmail: customer.email! }],
    },
    select: { id: true },
  });
  if (internalSender) return NextResponse.json({ success: true }, { status: 200 });

  const baseSubject = normalizeSubject(subject);

  const fallbackCreator = await prisma.user.findFirst({
    where: { role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (!fallbackCreator) return NextResponse.json({ success: true }, { status: 200 });

  // 1) Find existing open thread (by mailboxId + customerEmail + subject prefix).
  const thread = await prisma.emailThread.findFirst({
    where: {
      mailboxId: mailbox.id,
      customerEmail: customer.email,
      status: "OPEN",
      subject: baseSubject,
      isActive: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Ensure we have a thread record before uploading attachments
  // (so we can use the threadId in the R2 object keys).
  const ensuredThread = thread
    ? thread
    : await prisma.emailThread.create({
        data: {
          createdById: fallbackCreator.id,
          isActive: true,
          label: mailbox.label,
          subject: baseSubject,
          customerName: customer.name,
          customerEmail: customer.email!,
          mailboxId: mailbox.id,
          assignedToId: null,
          hasUnread: true,
          status: "OPEN",
        },
      });

  if (!emailId) {
    console.log("[InboundEmail] Ignored: Missing emailId in webhook data");
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // 2) Retrieve full email content from Resend.
  const received = await resend.emails.receiving.get(emailId);
  const receivedData = (received as { data?: ResendReceivedData }).data;

  const fullHtml = (receivedData?.html as string | undefined) ?? "<p></p>";
  const fullText = receivedData?.text as string | null | undefined;
  const ccArr = (receivedData?.cc as string[] | undefined) ?? [];
  const cc = ccArr.length ? ccArr.join(",") : null;

  // Attachments: use attachments.list() to get download URLs.
  const attachmentsMeta = await resend.emails.receiving.attachments.list({ emailId });
  const attachmentsData = (attachmentsMeta as unknown as { data?: unknown }).data;
  const attachments = Array.isArray(attachmentsData) ? (attachmentsData as ResendAttachmentMeta[]) : [];

  const storedAttachments: { name: string; r2Key: string; size: number; mimeType: string }[] = [];
  if (attachments.length && isR2Configured()) {
    for (const a of attachments) {
      const downloadUrl = a?.download_url as string | undefined;
      if (!downloadUrl) continue;
      
      // [Resend] API — updated to use header auth + error handling
      const dlRes = await fetch(downloadUrl, {
        headers: { "User-Agent": "PrintHub/1.0 (https://printhub.africa)" }
      });
      if (!dlRes.ok) {
        console.error(`[Resend] Attachment download error ${dlRes.status} for ${downloadUrl}`);
        continue;
      }
      const buffer = Buffer.from(await dlRes.arrayBuffer());

      const fileName = (a?.filename as string | undefined) ?? "attachment";
      const mimeType = (a?.content_type as string | undefined) ?? "application/octet-stream";
      const size = typeof a?.size === "number" ? a.size : buffer.byteLength;
      const r2Key = `email-attachments/${ensuredThread.id}/${a?.id ?? "att"}-${safeFileName(fileName)}`;

      await putObjectBuffer({
        bucket: "private",
        key: r2Key,
        body: buffer,
        contentType: mimeType,
      });

      storedAttachments.push({
        name: fileName,
        r2Key,
        size,
        mimeType,
      });
    }
  }

  // 4) Create an Email record (direction: INBOUND)
  await prisma.$transaction(async (tx) => {
    await tx.email.create({
      data: {
        threadId: ensuredThread.id,
        direction: "INBOUND",
        isRead: false,
        resendMessageId: messageId ?? undefined,
        bodyText: fullText ?? null,
        bodyHtml: fullHtml,
        subject: subject,
        cc,
        toAddress: mailbox.address,
        fromAddress: customer.email!,
        attachments: storedAttachments,
      },
    });

    // Mark the thread as having unread inbound messages.
    await tx.emailThread.update({
      where: { id: ensuredThread.id },
      data: {
        status: "OPEN",
        hasUnread: true,
      },
    });
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

