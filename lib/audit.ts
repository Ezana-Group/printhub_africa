/**
 * Audit logging for admin actions. Uses AuditLog model (entity, entityId, action, after).
 */
import { prisma } from "@/lib/prisma";

export type AuditParams = {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  /** @deprecated Use entityId instead; if entityId is omitted, targetId is used. */
  targetId?: string;
  /** @deprecated Use entity instead; if entity is omitted, category is used as entity. */
  category?: string;
  details?: string;
  after?: Record<string, unknown>;
  request?: Request;
};

export async function writeAudit(params: AuditParams): Promise<void> {
  const entity = params.entity ?? params.category ?? "Unknown";
  const entityId = params.entityId ?? params.targetId;
  const payload = { ...(params.after ?? {}), ...(params.details != null ? { details: params.details } : {}) };
  prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entity,
        entityId,
        after: Object.keys(payload).length ? payload : undefined,
        ipAddress: params.request?.headers.get("x-forwarded-for") ?? params.request?.headers.get("x-real-ip") ?? undefined,
      },
    })
    .catch((err) => console.error("Audit log write failed:", err));
}
