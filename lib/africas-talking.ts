/**
 * Africa's Talking SMS (Kenya)
 * https://africastalking.com
 */

const BASE_URL = "https://api.africastalking.com/version1";

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const key = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;
  if (!key || !username) {
    console.warn("AT_API_KEY / AT_USERNAME not set; SMS not sent");
    return true;
  }
  const phone = to.replace(/\D/g, "").replace(/^0/, "254");
  const body = new URLSearchParams({
    username,
    to: `+${phone}`,
    message: message.slice(0, 160),
  });
  const res = await fetch(`${BASE_URL}/messaging`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey: key,
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
