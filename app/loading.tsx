import SkeletonProductGrid from "@/components/SkeletonProductGrid";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.05] p-6 md:p-8">
          <div className="mb-5 h-8 w-60 animate-pulse rounded-lg bg-white/10" />
          <div className="mb-3 h-4 w-full max-w-2xl animate-pulse rounded-lg bg-white/10" />
          <div className="mb-8 h-4 w-2/3 max-w-xl animate-pulse rounded-lg bg-white/10" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-12 animate-pulse rounded-lg border border-white/10 bg-white/10" />
            <div className="h-12 animate-pulse rounded-lg border border-white/10 bg-white/10" />
            <div className="h-12 animate-pulse rounded-lg border border-white/10 bg-orange-500/20" />
          </div>
        </div>

        <div className="mb-6 mt-8 flex items-center justify-between gap-4">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-white/10" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-white/10" />
        </div>

        <SkeletonProductGrid />
      </section>
    </main>
  );
}
