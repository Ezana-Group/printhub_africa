export default function AdminLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}
