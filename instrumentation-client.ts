import * as Sentry from "@sentry/nextjs";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_DSN ||
  "https://4bb4b5d171d9823872bf4df402c6c069@o4511027307282432.ingest.de.sentry.io/4511027310755920";

Sentry.init({
  dsn,

  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  tracePropagationTargets: ["localhost", /^https:\/\/[^/]*\/api\/?/],

  enabled: process.env.NODE_ENV !== "development",

  ignoreErrors: [
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    "Non-Error promise rejection captured",
  ],

  beforeSend(event, hint) {
    if (event.exception?.values?.[0]?.value?.includes("404")) {
      return null;
    }
    return event;
  },
});
