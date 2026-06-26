export const dynamic = 'force-dynamic'

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-35 animate-float" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float delay-400" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-teal-100 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float delay-200" />
      </div>
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
