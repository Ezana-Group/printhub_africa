import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // 🔴 CRIT-3: VirusTotal API Key check — warn but do NOT crash the server
    // Throwing here prevents the container from ever starting, which is worse than
    // running temporarily without virus scanning. Set VIRUSTOTAL_API_KEY in Railway.
    if (process.env.NODE_ENV === "production" && !process.env.VIRUSTOTAL_API_KEY) {
      console.error(
        "\n\n⚠️  SECURITY WARNING: VIRUSTOTAL_API_KEY is missing.\n" +
        "File virus scanning is DISABLED. Set this key in your Railway environment variables.\n"
      );
    }
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
