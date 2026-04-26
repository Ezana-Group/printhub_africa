"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthPanelPublic } from "@/lib/auth-panel";

/** Brand icons for social sign-in (company logos). */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
/** Messages that depend on searchParams; wrapped in Suspense so the form can render immediately (fixes WebKit E2E). */
function LoginMessages({
  error,
  errorParam,
  verified,
}: {
  error: string;
  errorParam: string | null;
  verified: string | null;
}) {
  const authErrorMessage =
    errorParam === "CredentialsSignin"
      ? "Invalid email or password."
      : errorParam === "AccessDenied"
        ? "Social sign-in was cancelled or permission was denied."
        : errorParam === "SocialAdminDisabled"
          ? "For security, admin/staff accounts cannot sign in with a new social account. Use email/password."
        : errorParam === "OAuthSignin" ||
            errorParam === "OAuthCallback" ||
            errorParam === "OAuthCreateAccount" ||
            errorParam === "Callback"
          ? "Social sign-in failed. Please try again."
          : errorParam && errorParam.length > 0
            ? "Sign in failed. Please try again."
            : "";

  return (
    <>
      {verified === "1" && (
        <p className="text-sm text-success bg-success/10 border border-success/30 rounded-md p-2">
          Email verified. You can sign in now.
        </p>
      )}
      {errorParam === "InvalidOrExpiredToken" && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
          Verification link invalid or expired.
        </p>
      )}
      {(error || authErrorMessage) && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
          {error || authErrorMessage}
        </p>
      )}
    </>
  );
}

function LoginMessagesWithParams({ error }: { error: string }) {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");
  return <LoginMessages error={error} errorParam={errorParam} verified={verified} />;
}

/**
 * Helper to ensure a string is a legitimate asset URL (starts with /, http, or data:).
 * Prevents "Failed to load resource: 404 (login)" when config is invalid.
 */
function isValidAssetUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  // If it's just "login" or similar, it's likely a misconfiguration
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http") ||
    trimmed.startsWith("data:") ||
    trimmed.includes(".") // Catch paths like "bg.jpg"
  );
}

/**
 * Login form is rendered immediately (no Suspense around it) so E2E and WebKit
 * see #email / #password on first paint. Only the URL-dependent messages use Suspense.
 */
function getCallbackUrl() {
  if (typeof window === "undefined") return "/login/success";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("callbackUrl");
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/login/success";
}

export type AuthTab = "login" | "register";

const DEFAULT_PANEL: AuthPanelPublic = {
  backgroundColor: "#E84A0C",
  backgroundImagePath: null,
  carouselIntervalSeconds: 5,
  slides: [
    {
      id: "default",
      sortOrder: 0,
      subtitle: "PrintHub for teams & creators",
      headline: "Print experiences that get noticed.",
      body: "Upload artwork, approve proofs, and track production in one place.",
      imagePath: null,
    },
  ],
};

export type AuthPageProps = {
  initialTab?: AuthTab;
  /** Server-fetched panel config + slides; when null/undefined, built-in default is used. */
  panel?: AuthPanelPublic | null;
  /** Server-resolved social provider visibility to avoid hydration flicker. */
  socialProviders?: {
    google: boolean;
    facebook: boolean;
  };
};

export function AuthPage({
  initialTab = "login",
  panel: panelProp,
  socialProviders,
}: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const panel = panelProp ?? DEFAULT_PANEL;
  const slides = panel.slides.length > 0 ? panel.slides : DEFAULT_PANEL.slides;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const safeIndex = Math.min(currentSlideIndex, slides.length - 1);
  const currentSlide = slides[safeIndex];

  useEffect(() => {
    setCurrentSlideIndex((i) => Math.min(i, slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (panel.carouselIntervalSeconds <= 0 || slides.length <= 1) return;
    const t = setInterval(() => {
      setCurrentSlideIndex((i) => (i + 1) % slides.length);
    }, panel.carouselIntervalSeconds * 1000);
    return () => clearInterval(t);
  }, [panel.carouselIntervalSeconds, slides.length]);

  const showGoogle = socialProviders?.google ?? false;
  const showFacebook = socialProviders?.facebook ?? false;
  const showSocial = showGoogle || showFacebook;

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  const passwordsMatch = registerPassword === confirmPassword;
  const confirmPasswordTouched = confirmPassword.length > 0;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/customer/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error ?? "Invalid email or password.");
        setLoginLoading(false);
        return;
      }
      
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        callbackUrl: getCallbackUrl(),
        redirect: false,
      });

      setLoginLoading(false);
      if (result?.ok && result?.url) {
        window.location.href = result.url;
        return;
      }
      setLoginError(result?.error === "CredentialsSignin" ? "Invalid email or password." : result?.error ?? "Sign in failed.");
    } catch {
      setLoginError("Something went wrong");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    if (!acceptTerms) {
      setRegisterError("You must accept the Account Registration Terms to continue.");
      return;
    }
    if (registerPassword !== confirmPassword) {
      setRegisterError("Password and confirm password do not match.");
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          confirmPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          acceptTerms: true,
          marketingConsent,
          referralCode: referralCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error;
        setRegisterError(
          typeof err === "string"
            ? err
            : err?.firstName?.[0] ??
                err?.lastName?.[0] ??
                err?.email?.[0] ??
                err?.password?.[0] ??
                err?.confirmPassword?.[0] ??
                "Registration failed.",
        );
        return;
      }
      setRegisterSuccess(true);
    } finally {
      setRegisterLoading(false);
    }
  };

  const hasValidBg = isValidAssetUrl(panel.backgroundImagePath);
  const asideStyle: React.CSSProperties = hasValidBg
    ? { backgroundImage: `url("${panel.backgroundImagePath}")`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: panel.backgroundColor };

  const asideContent = (
    <>
      {panel.backgroundImagePath && (
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      )}
      <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <Link href="/" className="text-2xl font-accent font-semibold tracking-tight text-white">
          PrintHub
        </Link>
      </div>
      <div className="relative mt-6 space-y-3 flex-1 flex flex-col justify-center">
        {isValidAssetUrl(currentSlide?.imagePath) && (
          <div className="relative w-full aspect-video max-h-32 rounded-lg overflow-hidden mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSlide.imagePath as string}
              alt=""
              className="object-cover w-full h-full"
            />
          </div>
        )}
        {currentSlide?.subtitle && (
          <p className="text-[10px] md:text-xs font-medium uppercase tracking-[0.22em] text-white/70">
            {currentSlide.subtitle}
          </p>
        )}
        {currentSlide?.headline && (
          <h1 className="text-[22px] md:text-[26px] font-accent font-semibold leading-snug text-white">
            {currentSlide.headline}
          </h1>
        )}
        {currentSlide?.body && (
          <p className="text-xs md:text-sm text-white/80 max-w-sm">
            {currentSlide.body}
          </p>
        )}
      </div>
      <div className="relative mt-8 flex items-center gap-2 justify-center pb-1">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentSlideIndex(i)}
            className="rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={`Go to slide ${i + 1}`}
          >
            {i === safeIndex ? (
              <span className="h-1.5 w-6 rounded-full bg-white/90 block" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-white/40 block" />
            )}
          </button>
        ))}
      </div>
    </>
  );

  if (activeTab === "register" && registerSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1120px] min-h-[580px] overflow-hidden rounded-3xl bg-card shadow-lg border border-border flex flex-col md:flex-row items-stretch">
          <aside
            className="hidden md:flex relative w-[42%] min-w-0 flex-col justify-between px-8 py-8 text-white overflow-hidden"
            style={asideStyle}
          >
            {asideContent}
          </aside>
          <main className="flex-1 min-w-0 bg-background px-8 pt-6 pb-8 md:px-10 md:pt-8 md:pb-10 flex items-center justify-center">
            <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
              <CardHeader className="space-y-1 px-0">
                <CardTitle className="text-2xl font-accent">Check your email</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  We sent a verification link to {registerEmail}. Click it to verify your account, then sign in.
                </CardDescription>
              </CardHeader>
              <CardFooter className="px-0 pt-6">
                <Button
                  className="w-full bg-[#E84A0C] hover:bg-[#c93d08] text-primary-foreground font-semibold"
                  onClick={() => setActiveTab("login")}
                >
                  Go to sign in
                </Button>
              </CardFooter>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[1120px] min-h-[580px] overflow-hidden rounded-3xl bg-card shadow-lg border border-border flex flex-col md:flex-row items-stretch">
        <aside
          className="hidden md:flex relative w-[42%] min-w-0 flex-col justify-between px-8 py-8 text-white overflow-hidden"
          style={asideStyle}
        >
          {asideContent}
        </aside>

        <main className="flex-1 min-w-0 bg-background px-8 pt-6 pb-8 md:px-10 md:pt-8 md:pb-10 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="mb-6 flex w-full gap-3 overflow-x-auto rounded-xl bg-slate-50 p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "login"
                    ? "bg-[#CC3D00] text-white shadow-sm"
                    : "bg-[#E3F2FD] text-[#1565C0] hover:brightness-95"
                }`}
              >
                <span className="font-accent text-sm">Sign in</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "register"
                    ? "bg-[#CC3D00] text-white shadow-sm"
                    : "bg-[#FFF3E0] text-[#E65100] hover:brightness-95"
                }`}
              >
                <span className="font-accent text-sm">Create account</span>
              </button>
            </div>

            {activeTab === "login" ? (
              <Card className="border-0 shadow-none bg-transparent p-0">
                <CardHeader className="space-y-1 px-0">
                  <CardTitle className="font-accent text-2xl">Welcome back</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Sign in to manage orders, quotes, and artwork.
                  </CardDescription>
                </CardHeader>
                <form id="login-credentials" onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-5 px-0 pt-6">
                    <Suspense fallback={null}>
                      <LoginMessagesWithParams error={loginError} />
                    </Suspense>
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-email"
                        className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                      >
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-10 rounded-lg border border-border/70 bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px]"
                        style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="login-password"
                          className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                        >
                          Password
                        </Label>
                        <Link
                          href="/forgot-password"
                          className="text-xs font-medium hover:underline"
                          style={{ color: "#E84A0C" }}
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="h-10 rounded-lg border border-border/70 bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px]"
                        style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                      />
                    </div>
                  </CardContent>
                </form>
                <CardFooter className="flex flex-col gap-4 px-0 pt-4">
                  <Button
                    type="submit"
                    form="login-credentials"
                    className="w-full h-10 text-sm font-semibold"
                    style={{ backgroundColor: "#E84A0C" }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? "Signing in…" : "Sign in"}
                  </Button>

                  {showSocial && (
                    <>
                      <div className="relative w-full">
                        <span className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </span>
                        <span className="relative flex justify-center text-[11px] font-medium tracking-[0.21em] text-muted-foreground">
                          OR CONTINUE WITH
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 w-full">
                        {showGoogle && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 gap-3 border border-border/70 bg-background text-foreground text-sm font-medium hover:bg-accent/40"
                            onClick={() => signIn("google", { callbackUrl: getCallbackUrl() })}
                          >
                            <GoogleIcon className="h-5 w-5 shrink-0" />
                            Continue with Google
                          </Button>
                        )}
                        {showFacebook && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 gap-3 border border-border/70 bg-background text-foreground text-sm font-medium hover:bg-accent/40"
                            onClick={() => signIn("facebook", { callbackUrl: getCallbackUrl() })}
                          >
                            <FacebookIcon className="h-5 w-5 shrink-0" />
                            Continue with Facebook
                          </Button>
                        )}
                      </div>

                      <div className="relative w-full pt-2">
                        <span className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </span>
                        <span className="relative flex justify-center text-[11px] font-medium tracking-[0.21em] text-muted-foreground">
                          OR
                        </span>
                      </div>
                    </>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-10 text-sm font-medium"
                    asChild
                  >
                    <Link href="/login/magic">Email me a sign-in link</Link>
                  </Button>

                  <p className="text-[12px] text-center text-muted-foreground pt-1">
                    New to PrintHub?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="font-medium hover:underline"
                      style={{ color: "#E84A0C" }}
                    >
                      Create an account
                    </button>
                  </p>
                </CardFooter>
              </Card>
            ) : (
              <Card className="border-0 shadow-none bg-transparent p-0">
                <CardHeader className="space-y-1 px-0">
                  <CardTitle className="font-accent text-2xl">Create your PrintHub account</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Start a new project, save quotes, and reorder in a few clicks.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegisterSubmit}>
                  <CardContent className="space-y-4 px-0 pt-6">
                    {registerError && (
                      <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                        {registerError}
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="firstName"
                          className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                        >
                          First name
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          autoComplete="given-name"
                          className="h-10 rounded-lg border border-border/70 bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px]"
                          style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="lastName"
                          className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                        >
                          Last name
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          autoComplete="family-name"
                          className="h-10 rounded-lg border border-border/70 bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px]"
                          style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-email"
                        className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                      >
                        Email
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="h-10 rounded-lg border border-border/70 bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px]"
                        style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                      />
                    </div>

                    <div className="space-y-2">
                       <Label
                         htmlFor="referralCode"
                         className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                       >
                         Referral Code (Optional)
                       </Label>
                       <Input
                         id="referralCode"
                         type="text"
                         placeholder="e.g. PRINT-123"
                         value={referralCode}
                         onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                         className="h-10 rounded-lg border border-border/70 bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px]"
                         style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                       />
                     </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-password"
                        className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                      >
                        Password
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="h-10 rounded-lg border border-border/70 bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px]"
                        style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                      />
                      <p className="text-[11.5px] text-muted-foreground">
                        At least 8 characters, with uppercase, lowercase, number, and special character.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-[12px] font-medium tracking-[0.03em] uppercase text-muted-foreground"
                      >
                        Confirm password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        aria-invalid={confirmPasswordTouched && !passwordsMatch}
                        className={`h-10 rounded-lg border bg-white text-sm focus-visible:ring-offset-0 focus-visible:ring-[1.5px] ${
                          confirmPasswordTouched && !passwordsMatch ? "border-destructive focus-visible:ring-destructive" : "border-border/70"
                        }`}
                        style={{ outline: "none", boxShadow: "0 0 0 0 transparent" }}
                      />
                      {confirmPasswordTouched && !passwordsMatch && (
                        <p className="text-xs text-destructive">Passwords do not match.</p>
                      )}
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 rounded border-border/70"
                        style={{ accentColor: "#E84A0C" }}
                        required
                      />
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        I am 18 years of age or older and I agree to PrintHub&apos;s{" "}
                        <Link
                          href="/account-terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                          style={{ color: "#E84A0C" }}
                        >
                          Account Registration Terms
                        </Link>
                        , which incorporate our{" "}
                        <Link
                          href="/terms-of-service"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                          style={{ color: "#E84A0C" }}
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                          style={{ color: "#E84A0C" }}
                        >
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-1 rounded border-border/70"
                        style={{ accentColor: "#E84A0C" }}
                      />
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        I&apos;d like to receive news, promotions, and product updates from PrintHub by email. You can unsubscribe at any time.
                      </span>
                    </label>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 px-0 pt-4">
                    <Button
                      type="submit"
                      className="w-full h-10 text-sm font-semibold"
                      style={{ backgroundColor: "#E84A0C" }}
                      disabled={
                        registerLoading ||
                        !acceptTerms ||
                        !firstName.trim() ||
                        !lastName.trim() ||
                        !passwordsMatch ||
                        registerPassword.length < 8 ||
                        confirmPassword.length < 8
                      }
                    >
                      {registerLoading ? "Creating account…" : "Create account"}
                    </Button>

                    {showSocial && (
                      <>
                        <div className="relative w-full">
                          <span className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </span>
                          <span className="relative flex justify-center text-[11px] font-medium tracking-[0.21em] text-muted-foreground">
                            OR CONTINUE WITH
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 w-full">
                          {showGoogle && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 gap-3 border border-border/70 bg-background text-foreground text-sm font-medium hover:bg-accent/40"
                              onClick={() => signIn("google", { callbackUrl: "/" })}
                            >
                              <GoogleIcon className="h-5 w-5 shrink-0" />
                              Continue with Google
                            </Button>
                          )}
                          {showFacebook && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 gap-3 border border-border/70 bg-background text-foreground text-sm font-medium hover:bg-accent/40"
                              onClick={() => signIn("facebook", { callbackUrl: "/" })}
                            >
                              <FacebookIcon className="h-5 w-5 shrink-0" />
                              Continue with Facebook
                            </Button>
                          )}
                        </div>
                      </>
                    )}

                    <p className="text-xs text-center text-muted-foreground pt-1">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="font-medium hover:underline"
                        style={{ color: "#E84A0C" }}
                      >
                        Sign in
                      </button>
                    </p>

                    <p className="text-[11.5px] text-center text-muted-foreground pt-3">
                      Registering for a business?{" "}
                      <Link
                        href="/corporate/apply"
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                        style={{ color: "#E84A0C" }}
                      >
                        Apply for a Corporate Account →
                      </Link>
                    </p>
                  </CardFooter>
                </form>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
