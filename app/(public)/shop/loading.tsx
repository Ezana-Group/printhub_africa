export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
