export const dynamic = 'force-dynamic'
import ThemeToggle from '@/components/ThemeToggle'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background blobs — light mode only */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden dark:opacity-0 transition-opacity duration-200">
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float delay-400" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-teal-100 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float delay-200" />
      </div>
      {/* Dark mode blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 dark:opacity-100 transition-opacity duration-200">
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-emerald-900/30 rounded-full filter blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-900/20 rounded-full filter blur-3xl animate-float delay-400" />
      </div>

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle variant="pill" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
