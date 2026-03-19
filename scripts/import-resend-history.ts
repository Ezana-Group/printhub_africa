/**
 * Import historical sent emails from Resend into the internal email system.
 *
 * This pulls all sent emails from Resend's API and creates EmailThread + Email
 * records so they appear in the admin Email inbox.
 *
 * Run: npx tsx scripts/import-resend-history.ts
 */

import path from "node:path";
import { config } from "dotenv";

const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) throw new Error("RESEND_FULL_API_KEY or RESEND_API_KEY is not set.");

const EMAIL_SUFFIX = "@printhub.africa";

// Resend list-emails response shape
type ResendEmailListItem = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  last_event?: string;
  cc?: string[];
  bcc?: string[];
};

type ResendEmailDetail = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  created_at: string;
  cc?: string[];
};

function normalizeSubject(subject: string): string {
  return (subject ?? "")
    .trim()
    .replace(/^(re|fwd|fw)\s*:\s*/i, "")
    .trim();
}

function extractFromAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

async function fetchResendEmails(): Promise<ResendEmailListItem[]> {
  const allEmails: ResendEmailListItem[] = [];
  let afterId: string | undefined;
  let page = 0;

  console.log("Fetching emails from Resend API...\n");

  while (true) {
    page++;
    const url = new URL("https://api.resend.com/emails");
    url.searchParams.set("limit", "100");
    if (afterId) url.searchParams.set("after", afterId);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Resend API error (page ${page}):`, resp.status, text);
      break;
    }

    const json = (await resp.json()) as { data?: ResendEmailListItem[] };
    const batch = json.data ?? [];

    if (batch.length === 0) break;

    allEmails.push(...batch);
    console.log(`  Page ${page}: fetched ${batch.length} emails (total: ${allEmails.length})`);

    // If fewer than 100, we've reached the end
    if (batch.length < 100) break;

    afterId = batch[batch.length - 1].id;

    // Rate limit: 5 req/sec max
    await new Promise((r) => setTimeout(r, 250));
  }

  return allEmails;
}

async function fetchEmailDetail(emailId: string): Promise<ResendEmailDetail | null> {
  const resp = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  if (!resp.ok) return null;
  return (await resp.json()) as ResendEmailDetail;
}

async function main() {
  // 1. Fetch all sent emails from Resend
  const resendEmails = await fetchResendEmails();

  if (resendEmails.length === 0) {
    console.log("\nNo emails found in Resend. Nothing to import.");
    return;
  }

  console.log(`\nFound ${resendEmails.length} emails in Resend.\n`);

  // 2. Load mailboxes from DB
  const mailboxes = await prisma.emailAddress.findMany({
    where: { isActive: true },
    select: { id: true, address: true, label: true },
  });
  const mailboxByAddress = new Map(mailboxes.map((m) => [m.address.toLowerCase(), m]));

  // 3. Get a fallback creator (first admin/super admin)
  const fallbackCreator = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (!fallbackCreator) {
    console.error("No admin user found to use as thread creator.");
    return;
  }

  // 4. Check existing resend message IDs to avoid duplicates
  const existingEmails = await prisma.email.findMany({
    where: { resendMessageId: { not: null } },
    select: { resendMessageId: true },
  });
  const existingIds = new Set(existingEmails.map((e) => e.resendMessageId));

  let imported = 0;
  let skipped = 0;
  let noMailbox = 0;

  // 5. Process each email
  for (let i = 0; i < resendEmails.length; i++) {
    const item = resendEmails[i];

    // Skip already-imported
    if (existingIds.has(item.id)) {
      skipped++;
      continue;
    }

    // Determine the @printhub.africa mailbox
    const fromAddr = extractFromAddress(item.from);
    let mailbox = mailboxByAddress.get(fromAddr);

    // If sent FROM a printhub address, use that mailbox.
    // If sent TO a printhub address (unlikely for outbound), also check.
    if (!mailbox) {
      const toMatch = item.to
        .map((t) => t.toLowerCase().trim())
        .find((t) => mailboxByAddress.has(t));
      if (toMatch) mailbox = mailboxByAddress.get(toMatch);
    }

    if (!mailbox) {
      // This email wasn't sent from/to any known mailbox
      noMailbox++;
      continue;
    }

    // Fetch full email content from Resend
    const detail = await fetchEmailDetail(item.id);
    if (!detail) {
      console.log(`  ⚠ Could not fetch detail for ${item.id}, skipping`);
      continue;
    }

    // Determine customer email (the recipient for outbound emails)
    const customerEmail = item.to
      .map((t) => t.toLowerCase().trim())
      .find((t) => !t.endsWith(EMAIL_SUFFIX)) ?? item.to[0]?.toLowerCase().trim();

    if (!customerEmail) continue;

    const baseSubject = normalizeSubject(item.subject);

    // Find or create thread
    let thread = await prisma.emailThread.findFirst({
      where: {
        mailboxId: mailbox.id,
        customerEmail,
        subject: baseSubject,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!thread) {
      thread = await prisma.emailThread.create({
        data: {
          createdById: fallbackCreator.id,
          isActive: true,
          label: mailbox.label,
          subject: baseSubject,
          customerName: null,
          customerEmail,
          mailboxId: mailbox.id,
          assignedToId: null,
          hasUnread: false,
          status: "OPEN",
        },
      });
    }

    // Create the Email record
    const sentAt = new Date(item.created_at);
    await prisma.email.create({
      data: {
        threadId: thread.id,
        direction: "OUTBOUND",
        isRead: true,
        resendMessageId: item.id,
        bodyText: detail.text ?? null,
        bodyHtml: detail.html ?? `<p>${item.subject}</p>`,
        subject: item.subject,
        cc: detail.cc?.length ? detail.cc.join(",") : null,
        toAddress: customerEmail,
        fromAddress: fromAddr,
        sentAt,
        attachments: [],
      },
    });

    // Update thread timestamp to match the latest email
    await prisma.emailThread.update({
      where: { id: thread.id },
      data: { updatedAt: sentAt },
    });

    imported++;

    if (imported % 10 === 0) {
      console.log(`  ✓ Imported ${imported} emails so far...`);
    }

    // Rate limit Resend API
    await new Promise((r) => setTimeout(r, 220));
  }

  console.log(`\n========== Import Complete ==========`);
  console.log(`  ✓ Imported: ${imported}`);
  console.log(`  ⏭ Skipped (already imported): ${skipped}`);
  console.log(`  ⚠ No matching mailbox: ${noMailbox}`);
  console.log(`  Total processed: ${resendEmails.length}`);
}

main()
  .catch((e) => {
    console.error("Import error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
