import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN ||
  "https://4bb4b5d171d9823872bf4df402c6c069@o4511027307282432.ingest.de.sentry.io/4511027310755920";

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
    environment: process.env.NODE_ENV,
  });
}
