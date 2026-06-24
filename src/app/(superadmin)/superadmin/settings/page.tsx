import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import SettingsForms from './SettingsForms'

export const metadata = { title: 'Pengaturan — Superadmin' }

export default async function SuperAdminSettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/adm-panel')

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan Akun</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola kredensial login superadmin</p>
      </div>

      <SettingsForms userId={session.user.id} currentEmail={session.user.email ?? ''} />

      <div className="bg-yellow-950/40 border border-yellow-800/60 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-yellow-300">Catatan Keamanan</p>
            <ul className="text-xs text-yellow-400/80 mt-1.5 space-y-1 list-disc list-inside">
              <li>Ganti password default sebelum deploy ke production</li>
              <li>Gunakan password yang kuat dan unik</li>
              <li>Setelah ganti password, sesi aktif tetap berlaku — logout manual jika perlu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
