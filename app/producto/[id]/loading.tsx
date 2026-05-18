export default function LoadingProducto() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-xl shadow-black/30">
            <div className="h-[420px] w-full animate-pulse bg-white/10 md:h-[520px]" />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/20 md:p-8">
            <div className="mb-5 h-10 w-3/4 animate-pulse rounded-lg bg-white/10" />
            <div className="mb-4 h-5 w-40 animate-pulse rounded-lg bg-white/10" />
            <div className="mb-8 h-12 w-48 animate-pulse rounded-lg bg-orange-500/20" />

            <div className="mb-8 flex items-center gap-4">
              <div className="h-14 w-14 animate-pulse rounded-lg bg-white/10" />
              <div className="flex-1">
                <div className="mb-2 h-5 w-40 animate-pulse rounded-lg bg-white/10" />
                <div className="h-4 w-24 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-5/6 animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-2/3 animate-pulse rounded-lg bg-white/10" />
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="h-14 animate-pulse rounded-lg bg-orange-500/20" />
              <div className="h-14 animate-pulse rounded-lg bg-white/10" />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="mb-3 h-5 w-12 animate-pulse rounded-lg bg-white/10" />
                  <div className="h-4 w-full animate-pulse rounded-lg bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
