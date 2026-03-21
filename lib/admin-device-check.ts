import { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface DeviceInfo {
  ipAddress: string;
  userAgent: string;
  deviceName: string;
  country: string | null;
  city: string | null;
  deviceToken: string;
}

export function extractDeviceInfo(req: NextRequest | Request): DeviceInfo {
  const ipAddress =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for") ||
    "127.0.0.1";
    
  const userAgent = req.headers.get("user-agent") || "Unknown";
  
  // Vercel / Railway provide these headers if configured
  const country = req.headers.get("x-vercel-ip-country") || null;
  const city = req.headers.get("x-vercel-ip-city") || null;

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const deviceName = `${browser.name || "Unknown Browser"} on ${os.name || "Unknown OS"} ${device.type === "mobile" ? "(Mobile)" : ""}`.trim();

  // Create a device token based on stable properties
  // Note: For stronger persistence, this should ideally be stored in an HttpOnly 
  // long-lived cookie upon first successful login, but IP/UA hashing is a fallback.
  const rawTokenString = `${ipAddress}-${userAgent}-${country}-${city}`;
  const deviceToken = crypto.createHash("sha256").update(rawTokenString).digest("hex");

  return {
    ipAddress,
    userAgent,
    deviceName,
    country,
    city,
    deviceToken,
  };
}

export async function verifyAndLogAdminDevice(userId: string, req: NextRequest | Request, success: boolean, failReason?: string) {
  const deviceInfo = extractDeviceInfo(req);

  // 1. Check if device is trusted
  const existingDevice = await prisma.adminTrustedDevice.findUnique({
     where: { deviceToken: deviceInfo.deviceToken }
  });

  const isNewDevice = !existingDevice;

  // 2. Check if location is wildly different (basic check: new country if we have country data)
  let isNewLocation = false;
  if (deviceInfo.country) {
     const pastLogins = await prisma.adminLoginEvent.findFirst({
        where: { userId, country: { not: null }, success: true },
        orderBy: { createdAt: "desc" }
     });
     if (pastLogins && pastLogins.country !== deviceInfo.country) {
        isNewLocation = true;
     }
  }

  // 3. Log the event
  await prisma.adminLoginEvent.create({
     data: {
        userId,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        country: deviceInfo.country,
        city: deviceInfo.city,
        success,
        failReason,
        deviceToken: deviceInfo.deviceToken,
        isNewDevice,
        isNewLocation
     }
  });

  // 4. If successful and new, add to trusted devices (in a real app, require email verification first)
  if (success && isNewDevice) {
    await prisma.adminTrustedDevice.create({
       data: {
          userId,
          deviceToken: deviceInfo.deviceToken,
          deviceName: deviceInfo.deviceName,
          ipAddress: deviceInfo.ipAddress,
          country: deviceInfo.country,
          city: deviceInfo.city,
       }
    });

    // TODO: Send email alert for new login
    // sendNewLoginAlert(userEmail, deviceInfo)
  }

  return { isNewDevice, isNewLocation, deviceInfo };
}
