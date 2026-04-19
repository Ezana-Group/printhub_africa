import { prisma } from "./prisma";

const BASE_URL = "https://api.africastalking.com/version1";

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: {
      atApiKey: true,
      atUsername: true,
      atSenderId: true,
    },
  }).catch(() => null);

  const key = settings?.atApiKey || process.env.AT_API_KEY;
  const username = settings?.atUsername || process.env.AT_USERNAME;
  const from = settings?.atSenderId || undefined;

  if (!key || !username) {
    console.warn("AT_API_KEY / AT_USERNAME not set; SMS not sent");
    return false;
  }
  const phone = to.replace(/\D/g, "").replace(/^0/, "254");
  const params: Record<string, string> = {
    username,
    to: `+${phone}`,
    message: message.slice(0, 160),
  };
  if (from) params.from = from;

  const body = new URLSearchParams(params);

  const res = await fetch(`${BASE_URL}/messaging`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey: key,
      "User-Agent": "PrintHub/1.0 (https://printhub.africa)"
    },
    body: body.toString(),
  });
  if (!res.ok) {
    console.error("Africa's Talking SMS error:", await res.text());
    return false;
  }
  return true;
}

export function formatPhoneKenya(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+254${cleaned.slice(1)}`;
  return `+254${cleaned}`;
}
