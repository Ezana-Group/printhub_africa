import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await prisma.savedCard.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ cards });
}

export async function POST() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    { error: "Saved cards are no longer supported. Use PesaPal (card / mobile money) at checkout to pay." },
    { status: 410 }
  );
}
