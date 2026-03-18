export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="h-8 w-64 bg-[#1a1a1e] animate-pulse rounded" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-[#1a1a1e] animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="h-96 bg-[#1a1a1e] animate-pulse rounded-2xl" />
    </div>
  );
}
