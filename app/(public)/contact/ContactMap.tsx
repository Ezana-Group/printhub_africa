import Link from "next/link";

export function ContactMap({ googleMapsUrl }: { googleMapsUrl: string | null }) {
  if (!googleMapsUrl?.trim()) {
    return (
      <section className="px-4 pb-12 max-w-4xl mx-auto">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-2">Find us</h2>
        <p className="text-gray-600 text-sm">
          Map not configured. Add a map URL (OpenStreetMap, Google Maps, or any embed link) in Admin → Settings → Business.
        </p>
      </section>
    );
  }
  const isEmbed = googleMapsUrl.includes("/embed");
  return (
    <section className="px-4 pb-12 max-w-4xl mx-auto">
      <h2 className="font-display text-lg font-semibold text-gray-900 mb-2">Find us</h2>
      {isEmbed && (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-video">
          <iframe
            src={googleMapsUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location map"
            className="min-h-[240px]"
          />
        </div>
      )}
      <p className={isEmbed ? "mt-2 text-sm text-gray-600" : "text-sm text-gray-600"}>
        <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#CC3D00] hover:underline">
          Open in Maps
        </Link>
      </p>
    </section>
  );
}
