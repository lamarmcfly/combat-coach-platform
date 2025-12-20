interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-800';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width={80} height={24} variant="rectangular" />
          <Skeleton width={100} height={24} variant="rectangular" />
        </div>
        <Skeleton height={28} className="w-3/4" />
        <Skeleton height={16} className="w-full" />
        <Skeleton height={16} className="w-5/6" />
        <div className="pt-4">
          <div className="flex justify-between mb-2">
            <Skeleton width={60} height={14} />
            <Skeleton width={30} height={14} />
          </div>
          <Skeleton height={8} variant="rectangular" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 bg-gray-800/50">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={16} className="w-3/4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-800 last:border-0">
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} height={16} className={j === 1 ? 'w-full' : 'w-2/3'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <Skeleton height={14} width={80} className="mb-2" />
          <Skeleton height={36} width={60} />
        </div>
      ))}
    </div>
  );
}
