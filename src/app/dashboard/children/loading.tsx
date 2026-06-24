const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${h} ${w}`} />
)

export default function ChildrenLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <P w="w-24" h="h-7" />
        <P w="w-28" h="h-9" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="space-y-1.5">
                <P w="w-28" h="h-4" />
                <P w="w-20" h="h-3" />
              </div>
            </div>
            {/* Balance grid */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="rounded-lg bg-gray-50 p-2 space-y-1">
                  <P w="w-full" h="h-2" />
                  <P w="w-full" h="h-3" />
                </div>
              ))}
            </div>
            {/* Action buttons */}
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => <P key={j} w="w-full" h="h-7" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
