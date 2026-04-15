/**
 * Danger zone: confirm phrase + password (and optional 2FA) validation.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { verifySync } from "otplib";

function verifyTotp(secret: string, code: string): boolean {
  if (!secret || !code || code.length !== 6) return false;
  try {
    const result = verifySync({ secret, token: code });
    return result.valid;
  } catch {
    return false;
  }
}

export type DangerConfirmBody = {
  confirmPhrase?: string;
  password?: string;
  totpCode?: string;
};

/**
 * Core validation logic — accepts a pre-parsed body so callers that have
 * already consumed req.json() don't trigger a double-read (which would throw
 * because the readable stream is exhausted after the first read).
 */
async function validateDangerCore(
  body: DangerConfirmBody,
  phrase: string,
  requireTwoFa = false
): Promise<{ id: string; email: string; totpSecret: string | null }> {
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

/**
 * Validate danger confirmation from a raw Request.
 * NOTE: This reads req.json() internally. If your route has already called
 * req.json(), use validateDangerFromBody() instead to avoid a double-read error.
 */
export async function validateDanger(
  req: Request,
  phrase: string,
  requireTwoFa = false
): Promise<{ id: string; email: string; totpSecret: string | null }> {
  const body = (await req.json().catch(() => ({}))) as DangerConfirmBody;
  return validateDangerCore(body, phrase, requireTwoFa);
}

/**
 * Validate danger confirmation from a pre-parsed body object.
 * Use this when req.json() has already been called in the same handler to
 * avoid consuming the request stream twice.
 */
export async function validateDangerFromBody(
  body: DangerConfirmBody,
  phrase: string,
  requireTwoFa = false
): Promise<{ id: string; email: string; totpSecret: string | null }> {
  return validateDangerCore(body, phrase, requireTwoFa);
}
