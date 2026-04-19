import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const results = [];

  // Check 1: HTTPS Enforced
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";
  const isHttps = nextAuthUrl.startsWith("https://");
  results.push({
    id: "https",
    name: "HTTPS Enforced",
    status: isHttps ? "Pass" : "Fail",
    message: isHttps ? "NEXTAUTH_URL is using HTTPS." : "NEXTAUTH_URL is not using HTTPS. Secure cookies will be disabled.",
    suggestion: isHttps ? null : "Set NEXTAUTH_URL to use https:// in production.",
  });

  // Check 2: Security Headers in next.config.mjs
  let nextConfigContent = "";
  try {
    nextConfigContent = await fs.readFile(path.join(process.cwd(), "next.config.mjs"), "utf-8");
  } catch (err) {
    // try .js if .mjs fails
    try {
      nextConfigContent = await fs.readFile(path.join(process.cwd(), "next.config.js"), "utf-8");
    } catch {}
  }

  const checkHeader = (headerName: string, configKey: string) => {
    const hasHeader = nextConfigContent.includes(configKey) || nextConfigContent.includes(headerName);
    return {
      id: headerName.toLowerCase().replace(/[^a-z]/g, ""),
      name: `${headerName} header`,
      status: hasHeader ? "Pass" : "Fail",
      message: hasHeader ? `${headerName} is configured in next.config.js.` : `${headerName} is missing.`,
      suggestion: hasHeader ? null : `Add ${headerName} to next.config.js headers.`,
    };
  };

  results.push(checkHeader("X-Frame-Options", "X-Frame-Options"));
  results.push(checkHeader("Content-Security-Policy", "Content-Security-Policy"));
  results.push(checkHeader("X-Content-Type-Options", "X-Content-Type-Options"));
  results.push(checkHeader("Referrer-Policy", "Referrer-Policy"));
  results.push(checkHeader("Strict-Transport-Security", "Strict-Transport-Security"));

  // Check 7: Secure Cookies
  // NextAuth automatically uses secure cookies if the URL is HTTPS
  results.push({
    id: "securecookies",
    name: "Secure Cookies",
    status: isHttps ? "Pass" : "Warning",
    message: isHttps ? "Secure cookies are active." : "Secure cookies are only active on HTTPS.",
    suggestion: isHttps ? null : "Secure cookies require an HTTPS connection.",
  });

  return NextResponse.json(results);
}
