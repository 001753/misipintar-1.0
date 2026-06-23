/**
 * [7.4] Secure Context Detection
 * Menentukan apakah request berasal dari konteks HTTPS yang aman.
 * Tidak percaya header proxy kecuali TRUST_PROXY=true secara eksplisit.
 */
export function isSecureContext(headersList?: Headers): boolean {
  // Pertama: cek APP_URL dari env (paling aman — dikontrol operator)
  if (process.env.APP_URL?.startsWith('https://')) return true

  // Kedua: percaya proxy header HANYA jika TRUST_PROXY=true
  if (process.env.TRUST_PROXY === 'true' && headersList) {
    return headersList.get('x-forwarded-proto') === 'https'
  }

  // Default: tidak percaya — aman untuk development
  return false
}
