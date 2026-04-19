import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { NextResponse } from "next/server";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

export async function POST() {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
  });

  const bucket = settings?.storageBucket || process.env.R2_UPLOADS_BUCKET || process.env.AWS_S3_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "auto";

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ error: "Storage not configured in environment" }, { status: 400 });
  }

  try {
    const client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await client.send(new HeadBucketCommand({ Bucket: bucket }));

    return NextResponse.json({
      success: true,
      message: `Connected — bucket: ${bucket}, region: ${region}`,
    });
  } catch (error: any) {
    console.error("Storage test error:", error);
    return NextResponse.json({ error: `Connection failed: ${error.message}` }, { status: 500 });
  }
}
