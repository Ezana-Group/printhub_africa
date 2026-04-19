import { prisma } from "@/lib/prisma";
import { getLocationFromIp } from "@/lib/geo-detection";
import { n8n } from "@/lib/n8n";

export async function checkImpossibleTravel(params: {
  userId: string;
  currentIp: string;
  currentLocation: Awaited<ReturnType<typeof getLocationFromIp>>;
  sessionId: string;
}): Promise<{ isSuspicious: boolean; reason: string | null }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Find the most recent active session from another IP within the last hour
    const recentSession = await prisma.adminSession.findFirst({
      where: {
        userId: params.userId,
        revokedAt: null,
        lastActiveAt: { gt: oneHourAgo },
        id: { not: params.sessionId },
      },
      include: { user: true },
      orderBy: { lastActiveAt: "desc" },
    });

    if (!recentSession) {
      return { isSuspicious: false, reason: null };
    }
    
    if (!recentSession.ipCountry) {
      return { isSuspicious: false, reason: null };
    }

    if (!params.currentLocation || !params.currentLocation.country) {
      return { isSuspicious: false, reason: null }; 
    }

    if (recentSession.ipCountry !== params.currentLocation.country) {
      const timeDiffMs = Date.now() - recentSession.lastActiveAt.getTime();
      const timeDiffMins = Math.floor(timeDiffMs / (60 * 1000));
      const reason = `Country changed from ${recentSession.ipCountry} to ${params.currentLocation.country} within ${timeDiffMins} minutes.`;

      // Trigger n8n Alert Workflow
      n8n.impossibleTravel({
        userId: params.userId,
        userEmail: recentSession.user?.email || "unknown",
        userName: recentSession.user?.name || "Admin",
        previousCountry: recentSession.ipCountry,
        previousIp: recentSession.ipAddress || "unknown",
        previousLoginAt: recentSession.lastActiveAt.toISOString(),
        newCountry: params.currentLocation?.country || "unknown",
        newIp: params.currentIp,
        newLoginAt: new Date().toISOString(),
        superAdminEmail: "it@printhub.africa",
        adminProfileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/staff/${params.userId}`
      }).catch(err => console.error("n8n impossible-travel alert failed:", err));

      return { isSuspicious: true, reason };
    }

    return { isSuspicious: false, reason: null };
  } catch (error) {
    console.error("Error checking impossible travel:", error);
    return { isSuspicious: false, reason: null };
  }
}
