import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // 🔴 CRIT-3: Mandatory VirusTotal in Production
    if (process.env.NODE_ENV === "production" && !process.env.VIRUSTOTAL_API_KEY) {
      throw new Error(
        "\n\n❌ SECURITY ERROR: VIRUSTOTAL_API_KEY is missing.\n" +
        "Virus scanning is MANDATORY in production. Please set the key in your environment variables.\n"
      );
    }
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
