'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Terjadi Kesalahan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">
            Kode: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm transition-colors"
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  )
}
