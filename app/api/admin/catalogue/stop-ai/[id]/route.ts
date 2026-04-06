import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.catalogueImportQueue.update({
      where: { id },
      data: {
        aiEnhancementStatus: "manual",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STOP_AI_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
