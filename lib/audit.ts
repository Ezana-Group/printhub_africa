import { prisma } from "./prisma";

export interface AuditEntry {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  details?: any;
  category?: string; 
  targetType?: string;
  targetId?: string;
  request?: Request; // For backward compatibility
}

export async function createAuditLog(entry: AuditEntry) {
  try {
    let ip = entry.ipAddress;
    if (!ip && entry.request) {
      ip = entry.request.headers.get("x-forwarded-for") || undefined;
    }

    return await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity || entry.category || "SYSTEM",
        entityId: entry.entityId,
        before: entry.before ? JSON.parse(JSON.stringify(entry.before)) : undefined,
        ipAddress: ip,
        category: entry.category,
        targetType: entry.targetType,
        targetId: entry.targetId,
        after: entry.after ? JSON.parse(JSON.stringify(entry.after)) : (entry.details ? JSON.parse(JSON.stringify(entry.details)) : undefined),
      },
    });
  } catch (error) {
    console.error("[AuditLog] Error creating audit log entry:", error);
    return null;
  }
}

/** Backward compatibility wrapper for existing code */
export async function writeAudit(params: AuditEntry) {
  return createAuditLog(params);
}
