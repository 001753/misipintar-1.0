const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${h} ${w}`} />
)

export default function LedgerLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <P w="w-36" h="h-7" />

      {/* Child selector */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
            <P w="w-16" h="h-3" />
          </div>
        ))}
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            <P w="w-20" h="h-3" />
            <P w="w-28" h="h-6" />
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <P w="w-32" h="h-5" />
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-1.5">
                <P w="w-36" h="h-3" />
                <P w="w-24" h="h-2" />
              </div>
            </div>
            <P w="w-20" h="h-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
