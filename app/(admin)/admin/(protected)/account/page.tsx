"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Key, 
  Smartphone, 
  LogOut, 
  Clock, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function StaffAccountPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 2FA State
  const [twoFaStatus, setTwoFaStatus] = useState<{ enabled: boolean, secret?: string, otpauth?: string } | null>(null);
  const [otpToken, setOtpToken] = useState("");
  const [show2FaSetup, setShow2FaSetup] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetch2FaStatus();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch (err) {
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetch2FaStatus = async () => {
    try {
      const res = await fetch("/api/admin/account/2fa");
      const data = await res.json();
      setTwoFaStatus(data);
    } catch (err) {
      toast.error("Failed to fetch 2FA status");
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "DELETE",
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        toast.success("Session revoked");
        fetchSessions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke session");
      }
    } catch (err) {
      toast.error("Error revoking session");
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to log out from all other devices? This will keep your current session active.")) return;
    
    setLoading(true);
    try {
      // Assuming first session (idx 0) is current as highlighted in UI
      const currentSessionId = sessions[0]?.id;
      
      const res = await fetch("/api/admin/sessions/revoke-others", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSessionId }),
      });
      
      if (res.ok) {
        toast.success("All other sessions revoked");
        fetchSessions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke sessions");
      }
    } catch (err) {
      toast.error("Error revoking sessions");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "POST",
        body: JSON.stringify(passwordData),
      });
      if (res.ok) {
        toast.success("Password updated successfully");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update password");
      }
    } catch (err) {
      toast.error("Error updating password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handle2FaEnable = async () => {
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/admin/account/2fa", {
        method: "POST",
        body: JSON.stringify({ secret: twoFaStatus?.secret, token: otpToken }),
      });
      if (res.ok) {
        toast.success("2FA enabled successfully");
        setOtpToken("");
        setShow2FaSetup(false);
        fetch2FaStatus();
      } else {
        const data = await res.json();
        toast.error(data.error || "Invalid 2FA code");
      }
    } catch (err) {
      toast.error("Error enabling 2FA");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FaDisable = async () => {
    if (!confirm("Are you sure you want to disable 2FA? This decreases your account security.")) return;
    
    setTwoFaLoading(true);
    try {
      const res = await fetch("/api/admin/account/2fa", {
        method: "POST",
        body: JSON.stringify({ action: "disable" }),
      });
      if (res.ok) {
        toast.success("2FA disabled");
        fetch2FaStatus();
      }
    } catch (err) {
      toast.error("Error disabling 2FA");
    } finally {
      setTwoFaLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Security Settings
        </h1>
        <p className="text-muted-foreground">Manage your credentials, backup devices, and active sessions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Password Section */}
          <Section motionKey="password">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password. Password must be at least 12 characters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="password-form" onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  form="password-form" 
                  disabled={passwordLoading}
                  className="w-full md:w-auto"
                >
                  {passwordLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </CardFooter>
            </Card>
          </Section>

          {/* 2FA Section */}
          <Section motionKey="2fa">
            <Card className={twoFaStatus?.enabled ? "border-green-100 bg-green-50/20" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Two-Factor Authentication (TOTP)
                    </CardTitle>
                    <CardDescription>
                      Secure your account with an authentication app like Google Authenticator or Authy.
                    </CardDescription>
                  </div>
                  <Badge variant={twoFaStatus?.enabled ? "default" : "outline"} className={twoFaStatus?.enabled ? "bg-green-500" : ""}>
                    {twoFaStatus?.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!twoFaStatus?.enabled && !show2FaSetup && (
                  <div className="bg-muted/30 p-4 rounded-lg flex gap-4 items-start border border-dashed border-border">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Your account is less secure</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Without 2FA, your account is only protected by your password. We strongly recommend enabling it.
                      </p>
                      <Button 
                        variant="link" 
                        className="px-0 h-auto mt-2 text-primary"
                        onClick={() => setShow2FaSetup(true)}
                      >
                        Start Setup <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {show2FaSetup && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card border border-border p-6 rounded-xl"
                  >
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
                      {twoFaStatus?.otpauth && (
                        <QRCodeSVG value={twoFaStatus.otpauth} size={180} />
                      )}
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-4 text-center">
                        Scan this QR code in your app
                      </p>
                    </div>
                    <div className="space-y-4 flex flex-col justify-center">
                      <div className="space-y-2">
                        <Label>Enter 6-digit code</Label>
                        <Input 
                          placeholder="000 000" 
                          className="text-center text-2xl tracking-[0.5em] font-mono" 
                          maxLength={6}
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={handle2FaEnable} disabled={otpToken.length < 6 || twoFaLoading}>
                          {twoFaLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Enable"}
                        </Button>
                        <Button variant="ghost" onClick={() => setShow2FaSetup(false)}>Cancel</Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {twoFaStatus?.enabled && (
                  <div className="flex items-center gap-3 text-green-700 bg-green-50 p-4 rounded-lg border border-green-100">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-sm font-medium">Your account is protected by hardware-based authentication.</p>
                  </div>
                )}
              </CardContent>
              {twoFaStatus?.enabled && (
                <CardFooter className="border-t border-green-100 bg-green-50/10 pt-4">
                  <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handle2FaDisable} disabled={twoFaLoading}>
                    Disable 2FA
                  </Button>
                </CardFooter>
              )}
            </Card>
          </Section>
        </div>

        {/* Right Column: Sessions */}
        <div className="space-y-8">
          <Section motionKey="sessions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>
                  Your current active logins across different browsers and devices.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="space-y-1">
                  {sessions.map((session, idx) => (
                    <div key={session.id} className="flex flex-col px-6 py-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {session.ipAddress || "Unknown IP"}
                              {idx === 0 && <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">Current</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                              {session.userAgent || "Unknown Device"}
                            </p>
                          </div>
                        </div>
                        {idx !== 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRevoke(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last active: {new Date(session.lastActiveAt).toLocaleString()}
                        </div>
                      </div>
                      {idx < sessions.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                  {sessions.length === 0 && !loading && (
                    <div className="p-8 text-center text-muted-foreground">
                      No other active sessions.
                    </div>
                  )}
                  {loading && (
                    <div className="p-8 text-center">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border mt-0 p-4 flex flex-col gap-4">
                {sessions.length > 1 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    onClick={handleRevokeAll}
                    disabled={loading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Revoke All Other Sessions
                  </Button>
                )}
                <p className="text-[10px] text-center w-full text-muted-foreground">
                  If you see suspicious activity, change your password immediately.
                </p>
              </CardFooter>
            </Card>
          </Section>

          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Security Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-900 leading-relaxed">
                As a staff member, your account has access to sensitive business data. Always use a unique password and keep 2FA enabled.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ children, motionKey }: { children: React.ReactNode, motionKey: string }) {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
