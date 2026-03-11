// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_DSN ||
  "https://81b183787ffb811d356d000cf0dc861c@o4511027307282432.ingest.de.sentry.io/4511028138672208";

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  enabled: process.env.NODE_ENV !== "development",

  beforeSend(event) {
    if (event.request?.headers) {
      const headers = { ...event.request.headers };
      delete (headers as Record<string, unknown>)["authorization"];
      delete (headers as Record<string, unknown>)["cookie"];
      delete (headers as Record<string, unknown>)["x-api-key"];
      event.request = { ...event.request, headers };
    }
    return event;
  },
});
