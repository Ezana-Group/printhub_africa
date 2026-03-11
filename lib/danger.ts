/**
 * Danger zone: confirm phrase + password (and optional 2FA) validation.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// TOTP verification placeholder — replace with real impl if you use 2FA lib
function verifyTotp(secret: string, code: string): boolean {
  if (!secret || !code) return false;
  // TODO: use otplib or similar: return speakeasy.totp.verify({ secret, encoding: 'base32', token: code });
  return true;
}

export type DangerConfirmBody = {
  confirmPhrase?: string;
  password?: string;
  totpCode?: string;
};

export async function validateDanger(
  req: Request,
  phrase: string,
  requireTwoFa = false
): Promise<{ id: string; email: string; totpSecret: string | null }> {
  const body = (await req.json().catch(() => ({}))) as DangerConfirmBody;
  const { confirmPhrase, password, totpCode } = body;

  if (confirmPhrase !== phrase) {
    throw new Error(`Type "${phrase}" exactly to confirm`);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, passwordHash: true, totpSecret: true },
  });
  if (!user?.passwordHash) {
    throw new Error("User not found or no password set");
  }

  if (!(await bcrypt.compare(password ?? "", user.passwordHash))) {
    throw new Error("Incorrect password");
  }

  if (requireTwoFa) {
    if (!user.totpSecret) {
      throw new Error("2FA required for this action");
    }
    if (!verifyTotp(user.totpSecret, totpCode ?? "")) {
      throw new Error("Invalid 2FA code");
    }
  }

  return { id: user.id, email: user.email, totpSecret: user.totpSecret };
}
