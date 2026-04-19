import { prisma } from "@/lib/prisma";

export async function getPasswordPolicy() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { passwordPolicy: true },
  });
  
  const defaultPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    passwordExpiry: "Never",
    preventReuseOf: 5,
  };

  return { ...defaultPolicy, ...(settings?.passwordPolicy as any || {}) };
}

export function validatePasswordAgainstPolicy(password: string, policy: any) {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long.`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
