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

export default authOptions;
