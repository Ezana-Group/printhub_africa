import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadBuffer, isUploadConfigured } from "@/lib/s3";

async function uploadAvatar(formData: FormData, userId: string): Promise<string> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file");
  const ext = file.name.replace(/^.*\./, "") || "jpg";
  const key = `avatars/${userId}-${Date.now()}.${ext}`;
  if (isUploadConfigured()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return uploadBuffer(key, buffer, file.type || "image/jpeg");
  }
  return `/uploads/avatars/${Date.now()}-${file.name}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await req.formData();
    const url = await uploadAvatar(formData, session.user.id);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: url },
    });
    return NextResponse.json({ success: true, url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
