import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-display text-4xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">This page could not be found.</p>
      <Button asChild className="mt-6 rounded-xl">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
