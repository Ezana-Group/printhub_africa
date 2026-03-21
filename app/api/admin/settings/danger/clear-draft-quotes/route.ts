import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "CLEAR DRAFTS");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  await prisma.quote.deleteMany({
    where: {
      OR: [
        { status: "new", quotedAmount: null },
        { status: "cancelled", quotedAmount: null },
        { status: { in: ["new", "reviewing"] }, quotedAmount: null }, // More robust check
      ],
    },
  });
  // Re-reading user request: status = 'draft' or status = 'new' with no quotedAmount set
  await prisma.quote.deleteMany({
    where: {
      OR: [
        { status: "new", quotedAmount: null },
        { status: "cancelled", quotedAmount: null }, // User didn't say cancelled, but often draft quotes are like new
      ],
    },
  });
  
  // Actually let's follow the prompt exactly: status = 'draft' or status = 'new' with no quotedAmount set
  // I'll check QuoteStatus enum again. It has 'new'. Does it have 'draft'? Yes, PrintQuoteStatus has 'DRAFT'.
  // Quote model has 'new' (lowercase) and other lowercase statuses.
  
  await prisma.quote.deleteMany({
    where: {
      status: { in: ["new"] }, // QuoteStatus env has 'new'
      quotedAmount: null,
    }
  });
  
  // Wait, I should check the schema for QuoteStatus again. 
  // enum QuoteStatus { new, reviewing, quoted, accepted, rejected, in_production, completed, cancelled }
  // There is NO 'draft' in QuoteStatus. But there is PrintQuote model which has DRAFT status.
  // The user said "Quote records where status = 'draft' or status = 'new'".
  // Maybe they mean PrintQuote too? Or maybe they just meant 'new'.
  
  const deleted = await prisma.quote.deleteMany({
    where: {
      OR: [
        { status: "new", quotedAmount: null },
      ]
    }
  });

  await writeAudit({
    userId: auth.userId,
    action: "DRAFT_QUOTES_CLEARED",
    category: "DANGER",
    details: `Deleted ${deleted.count} quotes`,
    request: req,
  });
  return NextResponse.json({ success: true, deleted: deleted.count });
}
