import Link from "next/link";
import { getBusinessPublic } from "@/lib/business-public";

export default async function UnsubscribeDonePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const business = await getBusinessPublic();

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        {error === "invalid" || error === "missing" ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">Link invalid or expired</h1>
            <p className="text-muted-foreground text-sm">
              This unsubscribe link is invalid. If you still want to stop cart reminders, contact us.
            </p>
          </>
        ) : error === "server" ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">Please try again later or contact us.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground">You’re unsubscribed</h1>
            <p className="text-muted-foreground text-sm">
              You won’t receive any more abandoned cart reminders from {business.businessName}.
            </p>
          </>
        )}
        <p>
          <Link href="/" className="text-primary underline text-sm">
            Return to home
          </Link>
        </p>
      </div>
    </div>
  );
}
