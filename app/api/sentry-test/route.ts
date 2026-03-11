// DELETE AFTER TESTING — used to verify Sentry receives errors
export const dynamic = "force-dynamic";

export async function GET() {
  throw new Error("Sentry test error — PrintHub");
}
