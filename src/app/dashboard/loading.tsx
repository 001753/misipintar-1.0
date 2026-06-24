const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${h} ${w}`} />
)

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <P w="w-48" h="h-7" />
        <P w="w-64" h="h-4" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <P w="w-8" h="h-8" />
            <P w="w-20" h="h-6" />
            <P w="w-16" h="h-3" />
          </div>
        ))}
      </div>

      {/* Children row */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <P w="w-24" h="h-5" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-1">
                <P w="w-20" h="h-3" />
                <P w="w-14" h="h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <P w="w-32" h="h-5" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="space-y-1">
              <P w="w-44" h="h-4" />
              <P w="w-28" h="h-3" />
            </div>
            <P w="w-20" h="h-6" />
          </div>
        ))}
      </div>
    </div>
  )
}
