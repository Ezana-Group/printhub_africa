import crypto from "crypto";

export function hashData(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex");
}

export function hashEmail(email: string): string {
  return hashData(email.toLowerCase().trim());
}

export function hashPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const normalized = cleaned.startsWith("0")
    ? `+254${cleaned.slice(1)}`
    : cleaned.startsWith("254")
      ? `+${cleaned}`
      : phone;
  return hashData(normalized);
}
