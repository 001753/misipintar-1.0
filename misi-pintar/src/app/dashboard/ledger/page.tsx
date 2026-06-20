import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export default async function LedgerPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Ledger Saldo</h1>
      <p className="text-gray-500 text-sm mb-8">Phase 3 akan mengimplementasikan fitur ini.</p>
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
        <p className="text-4xl mb-3">🚧</p>
        <p className="text-gray-600 font-medium">Coming in Phase 3</p>
      </div>
    </div>
  )
}
