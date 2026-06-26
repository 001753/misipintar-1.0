export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

export default function PrivasiRedirect() {
  redirect('/kebijakan-privasi')
}
