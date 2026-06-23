const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-white/30 rounded-lg ${h} ${w}`} />
)

export default function ChildDashboardLoading() {
  return (
    <div className="space-y-4 pt-2">
      {/* Avatar & greeting skeleton */}
      <div className="text-center py-2 flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-full bg-white/30 animate-pulse" />
        <P w="w-40" h="h-5" />
        <P w="w-28" h="h-3" />
      </div>

      {/* Saldo card */}
      <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col items-center gap-2">
          <P w="w-24" h="h-3" />
          <P w="w-40" h="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 space-y-2">
            <P w="w-16" h="h-3" />
            <P w="w-20" h="h-4" />
          </div>
          <div className="bg-purple-50 rounded-xl p-3 space-y-2">
            <P w="w-16" h="h-3" />
            <P w="w-20" h="h-4" />
          </div>
        </div>
      </div>

      {/* Tugas aktif */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <P w="w-24" h="h-4" />
          <P w="w-16" h="h-5" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div className="space-y-1.5">
              <P w="w-36" h="h-3" />
              <P w="w-20" h="h-3" />
            </div>
            <P w="w-14" h="h-6" />
          </div>
        ))}
      </div>
    </div>
  )
}
