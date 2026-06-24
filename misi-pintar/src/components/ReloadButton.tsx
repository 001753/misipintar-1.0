'use client'

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 transition-colors"
    >
      Coba Lagi
    </button>
  )
}
