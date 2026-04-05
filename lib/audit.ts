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

const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'secret', 'key', 'accessToken', 'refreshToken', 'credential'];

function redactSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveFields);
  
  const redacted: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some(sf => k.toLowerCase().includes(sf.toLowerCase()))) {
      redacted[k] = '[REDACTED]';
    } else {
      redacted[k] = redactSensitiveFields(v);
    }
  }
  return redacted;
}

export async function createAuditLog(entry: AuditEntry) {
  try {
    let ip = entry.ipAddress;
    if (!ip && entry.request) {
      ip = entry.request.headers.get("x-forwarded-for") || undefined;
    }

    const beforeData = entry.before ? redactSensitiveFields(entry.before) : undefined;
    
    // Sometimes unstructured details come through 'after'. Try 'after' first, then fallback to 'details'.
    const rawAfter = entry.after !== undefined ? entry.after : entry.details;
    const afterData = rawAfter !== undefined ? redactSensitiveFields(rawAfter) : undefined;

    return await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity || entry.category || "SYSTEM",
        entityId: entry.entityId,
        before: beforeData,
        ipAddress: ip,
        category: entry.category,
        targetType: entry.targetType,
        targetId: entry.targetId,
        after: afterData,
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
