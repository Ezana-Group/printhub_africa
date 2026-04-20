import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { getServiceFlags } from "@/lib/service-flags";

export default async function LargeFormatPage() {
  const { largeFormatEnabled } = await getServiceFlags();
  if (!largeFormatEnabled) {
    notFound();
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="font-display text-3xl font-bold text-slate-900">Large Format Printing</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Banners, backdrops, vehicle wraps, canvas prints, and more. Upload your design to get a quote.
        </p>
      </div>

      <div className="max-w-3xl mb-12">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Services</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {["Vinyl & Flex Banners", "Billboard Printing", "Vehicle Wraps", "Event Backdrops", "Canvas Prints", "Roll-up Banners", "Mesh Banners", "Foam Board", "Window Graphics", "Wall Murals", "Floor Graphics", "Fabric Banners"].map((s) => (
            <li key={s} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800">{s}</li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-slate-500">
          Max print width: 3.2m. Files: AI, PDF, PSD, EPS, PNG 300DPI+. Standard turnaround 3–5 days; express 24–48hrs.
        </p>
      </div>

      <div className="mt-8 mb-12">
        <Button asChild className="rounded-xl">
          <Link href="/get-a-quote">Upload your design to get a quote</Link>
        </Button>
      </div>
    </div>
  );
}
