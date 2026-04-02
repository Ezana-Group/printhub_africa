"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Shield } from "lucide-react";

export function AdminHeaderClient({
  userName,
  userEmail,
}: {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
}) {
  return (
    <header className="fixed top-0 left-56 right-0 z-30 h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <span className="text-sm text-muted-foreground">
        {userName ?? userEmail}
      </span>
      <div className="flex items-center gap-3">
        <Link href="/admin/account" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Security
        </Link>
        <Link href="/" className="text-sm text-primary hover:underline">
          View site
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login", redirect: true })}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Log out
        </Button>
      </div>
    </header>
  );
}
