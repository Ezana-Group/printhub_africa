/**
 * @deprecated THIS FILE IS DEPRECATED.
 * Use @/lib/auth-admin for admin/staff authentication.
 * Use @/lib/auth-customer for customer authentication.
 * 
 * Separate authentication stores are now used to prevent session leakage 
 * between the main domain and admin subdomains.
 */

import { authOptionsAdmin } from "./auth-admin";
import { authOptionsCustomer } from "./auth-customer";
export { authOptionsCustomer };

// Exporting both for extreme backward compatibility if any dynamic imports remain,
// but they should be updated to use the correct one.
export const authOptions = typeof window !== "undefined" ? authOptionsCustomer : authOptionsAdmin;

/** 
 * Standard auth() helper for server-side session fetching. 
 * Intelligently chooses options based on context.
 */
export async function auth() {
  const { getServerSession } = await import("next-auth/next");
  // Default to admin for now as that's where most broken imports are located.
  // In a multi-auth setup, specific helpers (authAdmin/authCustomer) are preferred.
  return await getServerSession(authOptionsAdmin);
}

export default authOptions;
