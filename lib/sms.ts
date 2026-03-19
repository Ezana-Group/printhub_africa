/**
 * SMS sending for 2FA and notifications. Uses Africa's Talking when AT_API_KEY is set.
 */
import { sendSMS } from "@/lib/africas-talking";

export async function sendSms({ to, body }: { to: string; body: string }): Promise<void> {
  await sendSMS(to, body);
}
