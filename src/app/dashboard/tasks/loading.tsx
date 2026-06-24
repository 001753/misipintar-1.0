const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${h} ${w}`} />
)

export default function TasksLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <P w="w-32" h="h-7" />
        <P w="w-28" h="h-9" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => <P key={i} w="w-20" h="h-8" />)}
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <P w="w-48" h="h-4" />
                <P w="w-64" h="h-3" />
                <div className="flex gap-2 pt-1">
                  <P w="w-20" h="h-5" />
                  <P w="w-24" h="h-5" />
                </div>
              </div>
              <P w="w-24" h="h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
