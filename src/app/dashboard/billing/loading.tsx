const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${h} ${w}`} />
)

export default function BillingLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <P w="w-48" h="h-7" />
        <P w="w-64" h="h-4" />
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <P w="w-24" h="h-3" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              <P w="w-32" h="h-6" />
              <P w="w-16" h="h-6" />
            </div>
          </div>
          <P w="w-24" h="h-9" />
        </div>
      </div>

      {/* Cycle toggle */}
      <P w="w-52" h="h-10" />

      {/* Plan cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              <P w="w-24" h="h-5" />
            </div>
            <P w="w-32" h="h-8" />
            <div className="space-y-2">
              {[1, 2, 3].map((j) => <P key={j} w="w-full" h="h-3" />)}
            </div>
            <P w="w-full" h="h-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
