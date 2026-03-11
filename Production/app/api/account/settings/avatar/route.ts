import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Placeholder: upload to R2, return URL
async function uploadAvatar(formData: FormData): Promise<string> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file");
  // TODO: R2 upload
  return `/uploads/avatars/${Date.now()}-${file.name}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await req.formData();
    const url = await uploadAvatar(formData);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: url },
    });
    return NextResponse.json({ success: true, url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
