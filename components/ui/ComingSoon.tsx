import Link from "next/link";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500 text-sm">Coming soon.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-[#FF4D00] hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
