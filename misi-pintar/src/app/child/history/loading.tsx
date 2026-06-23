const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-white/30 rounded-lg ${h} ${w}`} />
)
const PD = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${h} ${w}`} />
)

export default function ChildHistoryLoading() {
  return (
    <div className="pt-4 space-y-4">
      <P w="w-32" h="h-6" />
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-1.5">
                <PD w="w-32" h="h-3" />
                <PD w="w-20" h="h-2" />
              </div>
            </div>
            <PD w="w-16" h="h-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
