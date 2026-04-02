import NextAuth from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";

const handler = NextAuth(authOptionsCustomer);
export { handler as GET, handler as POST };
