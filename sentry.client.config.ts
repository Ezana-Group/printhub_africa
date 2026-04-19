// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://81b183787ffb811d356d000cf0dc861c@o4511027307282432.ingest.de.sentry.io/4511028138672208";

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay may only be enabled for the client-side
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  enabled: process.env.NODE_ENV !== "development",
});
