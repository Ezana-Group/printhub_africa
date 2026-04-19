import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        description: true,
        shortDescription: true,
        metaTitle: true,
        metaDescription: true,
        aiDescriptionGenerated: true,
      }
    });

    if (!product) {
       return new NextResponse("Not Found", { status: 404 });
    }

    // Usually, we check if the AI description flag is set or if fields are no longer empty
    // For this context, "complete" means the AI generated some data
    const complete = !!product.aiDescriptionGenerated || (!!product.description && product.description.length > 50);

    return NextResponse.json({
      complete,
      description: product.description,
      shortDescription: product.shortDescription,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
    });
  } catch (error) {
    console.error("[AI_STATUS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
