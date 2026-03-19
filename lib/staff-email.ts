const STAFF_WORK_EMAIL_SUFFIX = "@printhub.africa";

/** Login / work email for staff must use the company domain. */
export function isStaffWorkEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(STAFF_WORK_EMAIL_SUFFIX);
}

export function isPrivilegedStaffRole(role: string): boolean {
  return role === "STAFF" || role === "ADMIN" || role === "SUPER_ADMIN";
}
