import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real application, you would generate a secure token 
    // and send a verification email via Resend/SendGrid here.
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to resend email" }, { status: 500 });
  }
}
