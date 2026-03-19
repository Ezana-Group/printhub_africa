import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "STAFF", "SUPER_ADMIN"];

const patchSchema = z.object({
  showOnAboutPage: z.boolean().optional(),
  publicName: z.string().max(200).nullable().optional(),
  publicRole: z.string().max(200).nullable().optional(),
  publicBio: z.string().max(1000).nullable().optional(),
  profilePhotoUrl: z.string().url().max(2000).nullable().optional(),
  aboutPageOrder: z.number().int().min(0).optional(),
});

/** PATCH: Update staff public profile (about page visibility and display fields). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: userId } = await params;
  const targetUser = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const allowed: Record<string, unknown> = {};
  if (data.showOnAboutPage !== undefined) allowed.showOnAboutPage = data.showOnAboutPage;
  if (data.publicName !== undefined) allowed.publicName = data.publicName;
  if (data.publicRole !== undefined) allowed.publicRole = data.publicRole;
  if (data.publicBio !== undefined) allowed.publicBio = data.publicBio;
  if (data.profilePhotoUrl !== undefined) allowed.profilePhotoUrl = data.profilePhotoUrl;
  if (data.aboutPageOrder !== undefined) allowed.aboutPageOrder = data.aboutPageOrder;

  const updated = await prisma.staff.upsert({
    where: { userId },
    update: allowed,
    create: {
      userId,
      department: null,
      position: null,
      showOnAboutPage: Boolean(data.showOnAboutPage),
      publicName: data.publicName ?? null,
      publicRole: data.publicRole ?? null,
      publicBio: data.publicBio ?? null,
      profilePhotoUrl: data.profilePhotoUrl ?? null,
      aboutPageOrder: data.aboutPageOrder ?? 0,
    },
  });

  await writeAudit({
    userId: actorId,
    action: "STAFF_PUBLIC_PROFILE_UPDATED",
    entity: "STAFF",
    entityId: userId,
    after: {
      showOnAboutPage: data.showOnAboutPage,
      publicName: data.publicName,
      publicRole: data.publicRole,
      publicBio: data.publicBio,
      profilePhotoUrl: data.profilePhotoUrl,
      aboutPageOrder: data.aboutPageOrder,
    },
    request: req,
  });

  revalidatePath("/about");
  revalidateTag("team-members");

  return NextResponse.json({ success: true, staff: updated });
}
