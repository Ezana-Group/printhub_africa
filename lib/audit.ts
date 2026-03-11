/**
 * Audit logging for admin and system actions.
 * Uses AuditLog model; category/target/details map to entity/entityId where appropriate.
 */
import { prisma } from "@/lib/prisma";
import type { Request } from "next/server";

export type AuditParams = {
  userId?: string;
  action: string;
  category?: string;
  target?: string;
  targetId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  details?: string;
  request?: Request;
};

export async function writeAudit(params: AuditParams): Promise<void> {
  const ip = params.request?.headers.get("x-forwarded-for") ?? params.request?.headers.get("x-real-ip") ?? null;
  const ua = params.request?.headers.get("user-agent") ?? null;
  const category = params.category ?? "GENERAL";
  const entity = params.target ?? "SETTINGS";
  const entityId = params.targetId ?? undefined;

  prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entity,
        entityId,
        category,
        target: params.target,
        targetId: params.targetId,
        details: params.details,
        before: params.oldValue != null ? (typeof params.oldValue === "object" ? params.oldValue : { value: params.oldValue }) : undefined,
        after: params.newValue != null ? (typeof params.newValue === "object" ? params.newValue : { value: params.newValue }) : undefined,
        ipAddress: ip,
        userAgent: ua,
      },
    })
    .catch((err) => console.error("Audit log write failed:", err));
}
