export default function SkeletonProductCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20">
      <div className="h-48 w-full animate-pulse bg-white/10" />

      <div className="space-y-4 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded-lg bg-white/10" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-white/10" />
        <div className="h-6 w-1/3 animate-pulse rounded-lg bg-orange-500/20" />

        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-white/10" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  );
}
