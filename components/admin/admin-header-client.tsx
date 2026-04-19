"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Zap } from "lucide-react";

export function AdminHeaderClient({
  userName,
  userEmail,
  role,
}: {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  role: string | null | undefined;
}) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <header className="fixed top-0 left-56 right-0 z-30 h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <span className="text-sm text-muted-foreground mr-auto">
        {userName ?? userEmail}
        {role && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
            {role}
          </span>
        )}
      </span>
      <div className="flex items-center gap-3">
        <Link href="/admin/account" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Security
        </Link>
        
        {isAdmin && (
          <a 
            href="/api/admin/n8n/sso" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium mr-2"
          >
            <Zap className="h-3.5 w-3.5" />
            Automations
          </a>
        )}

        <a 
          href={process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline mr-4"
        >
          View site
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={async (e) => {
            e.preventDefault();
            // Using the custom logout route to ensure DB session and admin cookies are cleared
            await fetch("/api/auth/admin/logout", { method: "POST" }).catch(err => console.error("Logout fetch failed:", err));
            window.location.href = "/admin/login";
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Log out
        </Button>
      </div>
    </header>
  );
}
