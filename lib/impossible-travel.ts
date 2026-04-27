import { prisma } from "@/lib/prisma";
import { getLocationFromIp } from "@/lib/geo-detection";
import { sendAdminAlert } from "@/lib/email";

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

      sendAdminAlert({
        event: "Negative Review",
        subject: `Impossible Travel Detected — ${recentSession.user?.email || params.userId}`,
        html: `<p><strong>Security Alert: Impossible Travel</strong><br>${reason}<br>User: ${recentSession.user?.email}<br>Previous country: ${recentSession.ipCountry}<br>New country: ${params.currentLocation?.country}<br><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/staff/${params.userId}">View profile</a></p>`,
      }).catch(err => console.error("Admin alert (impossible travel) failed:", err));

      return { isSuspicious: true, reason };
    }

    return { isSuspicious: false, reason: null };
  } catch (error) {
    console.error("Error checking impossible travel:", error);
    return { isSuspicious: false, reason: null };
  }
}
