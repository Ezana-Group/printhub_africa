import crypto from "crypto";

const TOKEN_BYTES = 32;
const VERIFY_EMAIL_EXPIRY_HOURS = 24;
const RESET_PASSWORD_EXPIRY_HOURS = 1;
const STAFF_INVITE_EXPIRY_HOURS = 48;

export function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

export function getVerifyEmailExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + VERIFY_EMAIL_EXPIRY_HOURS);
  return d;
}

export function getResetPasswordExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + RESET_PASSWORD_EXPIRY_HOURS);
  return d;
}

export function getStaffInviteExpiry(): Date {
  const d = new Date();
  d.setHours(d.getHours() + STAFF_INVITE_EXPIRY_HOURS);
  return d;
}
