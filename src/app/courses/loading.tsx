export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="h-8 w-48 bg-[#1a1a1e] animate-pulse rounded" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-[#1a1a1e] animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
