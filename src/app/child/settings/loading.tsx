const P = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-white/30 rounded-lg ${h} ${w}`} />
)
const PD = ({ w, h = 'h-4' }: { w: string; h?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${h} ${w}`} />
)

export default function ChildSettingsLoading() {
  return (
    <div className="pt-4 space-y-4">
      <P w="w-36" h="h-6" />

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 shadow">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="space-y-2">
            <PD w="w-32" h="h-4" />
            <PD w="w-24" h="h-3" />
            <PD w="w-36" h="h-3" />
          </div>
        </div>
      </div>

      {/* Password card */}
      <div className="bg-white rounded-2xl p-5 shadow space-y-4">
        <PD w="w-36" h="h-5" />
        <PD w="w-full" h="h-10" />
        <PD w="w-full" h="h-10" />
        <PD w="w-full" h="h-10" />
        <PD w="w-full" h="h-11" />
      </div>
    </div>
  )
}
