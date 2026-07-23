export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default async function QrisStaticPage({
  searchParams,
}: {
  searchParams: Promise<{ planType?: string; cycle?: string }>
}) {
  // URL lama masih aman dikunjungi, tetapi tidak lagi menampilkan jalur QRIS.
  await searchParams
  redirect('/dashboard/billing')
}
