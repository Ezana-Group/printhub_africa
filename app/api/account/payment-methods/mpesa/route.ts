import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+254" + digits.slice(1);
  if (digits.startsWith("254")) return "+" + digits;
  if (digits.startsWith("7") || digits.startsWith("1"))
    return "+254" + digits;
  return phone;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const numbers = await prisma.savedMpesaNumber.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ numbers });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone, label } = await req.json();
  if (!phone)
    return NextResponse.json(
      { error: "Phone number required" },
      { status: 400 }
    );

  const formatted = formatPhone(phone);

  if (!formatted.match(/^\+2547\d{8}$|^\+2541\d{8}$/)) {
    return NextResponse.json(
      { error: "Please enter a valid Kenyan M-Pesa number" },
      { status: 400 }
    );
  }

  const count = await prisma.savedMpesaNumber.count({
    where: { userId: session.user.id },
  });
  if (count >= 2) {
    return NextResponse.json(
      { error: "Maximum 2 M-Pesa numbers allowed" },
      { status: 400 }
    );
  }

  const isFirst = count === 0;

  const number = await prisma.savedMpesaNumber.create({
    data: {
      userId: session.user.id,
      phone: formatted,
      label: label || "My M-Pesa",
      isDefault: isFirst,
    },
  });

  return NextResponse.json({ success: true, number });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id)
    return NextResponse.json(
      { error: "Number id required" },
      { status: 400 }
    );

  await prisma.savedMpesaNumber.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id)
    return NextResponse.json(
      { error: "Number id required" },
      { status: 400 }
    );

  const existing = await prisma.savedMpesaNumber.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.savedMpesaNumber.updateMany({
    where: { userId: session.user.id },
    data: { isDefault: false },
  });
  await prisma.savedMpesaNumber.update({
    where: { id },
    data: { isDefault: true },
  });

  return NextResponse.json({ success: true });
}
