const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-white/30 rounded-lg ${h} ${w}`} />
)

export default function ChildTasksLoading() {
  return (
    <div className="space-y-4 pt-4">
      <P w="w-32" h="h-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex justify-between">
              <P w="w-40" h="h-4" />
              <P w="w-16" h="h-5" />
            </div>
            <P w="w-28" h="h-3" />
            <div className="flex gap-2 pt-1">
              <P w="w-20" h="h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
