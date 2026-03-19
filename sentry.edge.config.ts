// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_DSN ||
  "https://81b183787ffb811d356d000cf0dc861c@o4511027307282432.ingest.de.sentry.io/4511028138672208";

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV !== "development",
});
