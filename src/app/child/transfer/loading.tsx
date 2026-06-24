const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-white/30 rounded-lg ${h} ${w}`} />
)
const PD = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${h} ${w}`} />
)

export default function ChildTransferLoading() {
  return (
    <div className="pt-4 space-y-4">
      <P w="w-32" h="h-6" />

      {/* Balance preview */}
      <div className="bg-white rounded-2xl p-5 shadow space-y-3">
        <PD w="w-24" h="h-3" />
        <PD w="w-36" h="h-8" />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
            <PD w="w-16" h="h-3" />
            <PD w="w-20" h="h-4" />
          </div>
          <div className="bg-purple-50 rounded-xl p-3 space-y-1.5">
            <PD w="w-16" h="h-3" />
            <PD w="w-20" h="h-4" />
          </div>
        </div>
      </div>

      {/* Transfer form skeleton */}
      <div className="bg-white rounded-2xl p-5 shadow space-y-4">
        <PD w="w-40" h="h-5" />
        <PD w="w-full" h="h-10" />
        <PD w="w-full" h="h-10" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => <PD key={i} w="w-full" h="h-8" />)}
        </div>
        <PD w="w-full" h="h-11" />
      </div>
    </div>
  )
}
