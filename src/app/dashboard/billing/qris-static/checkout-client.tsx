'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Plan = {
  id: string
  type: string
  name: string
  price: number
  yearlyPrice: number
}

type PendingPayment = {
  id: string
  planType: string
  billingCycle: string
  totalAmount: number
  uniqueCode: number
  proofImagePath: string | null
}

interface Props {
  plans: Plan[]
  defaultPlanType: string | null
  defaultCycle: 'MONTHLY' | 'YEARLY' | null
  pendingPayment: PendingPayment | null
  nmid: string
  merchantName: string
}

function fmt(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

const PLAN_LABELS: Record<string, string> = {
  PRO: 'Pro',
  EDUCATOR: 'Educator',
}

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'Bulanan',
  YEARLY: 'Tahunan',
}

type CheckoutData = {
  id: string
  planType: string
  planName: string
  billingCycle: string
  baseAmount: number
  uniqueCode: number
  totalAmount: number
}

// ── Step 1: Pilih Plan ────────────────────────────────────────────────────────
function StepPilihPlan({
  plans,
  defaultPlanType,
  defaultCycle,
  onNext,
}: {
  plans: Plan[]
  defaultPlanType: string | null
  defaultCycle: 'MONTHLY' | 'YEARLY' | null
  onNext: (data: CheckoutData) => void
}) {
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanType ?? 'PRO')
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>(defaultCycle ?? 'MONTHLY')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = plans.find((p) => p.type === selectedPlan)
  const price = plan ? (cycle === 'YEARLY' ? plan.yearlyPrice : plan.price) : 0

  async function handleLanjut() {
    if (!plan) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: selectedPlan, billingCycle: cycle }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Terjadi kesalahan')
        return
      }
      // Teruskan data API ke parent — tidak perlu fetch ulang
      onNext(data as CheckoutData)
    } catch {
      setError('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pilih Paket</h2>
        <p className="text-sm text-gray-500 mt-1">
          Pembayaran via QRIS Statis — transfer tepat nominal yang tertera
        </p>
      </div>

      {/* Toggle siklus */}
      <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
        {(['MONTHLY', 'YEARLY'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              cycle === c
                ? 'bg-white text-emerald-700 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {CYCLE_LABELS[c]}
            {c === 'YEARLY' && (
              <span className="ml-1 text-xs text-emerald-600 font-semibold">Hemat ~17%</span>
            )}
          </button>
        ))}
      </div>

      {/* Kartu plan */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((p) => {
          const harga = cycle === 'YEARLY' ? p.yearlyPrice : p.price
          const active = selectedPlan === p.type
          return (
            <button
              key={p.type}
              onClick={() => setSelectedPlan(p.type)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                active
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">{p.name}</span>
                {active && (
                  <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                    Dipilih
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-emerald-700">{fmt(harga)}</div>
              <div className="text-xs text-gray-500 mt-0.5">/{CYCLE_LABELS[cycle].toLowerCase()}</div>
            </button>
          )
        })}
      </div>

      {/* Ringkasan */}
      {plan && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <p>
            Anda akan membayar{' '}
            <strong className="text-blue-900">
              {fmt(price)} + kode unik 3 digit
            </strong>{' '}
            ke QRIS {'{merchantName}'}.
          </p>
          <p className="mt-1 text-blue-600">
            Nominal tepat penting agar pembayaran mudah diverifikasi admin.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <button
        onClick={handleLanjut}
        disabled={loading || !plan}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Memproses...' : 'Lanjut ke Pembayaran →'}
      </button>
    </div>
  )
}

// ── Step 2: Bayar + Upload Bukti ──────────────────────────────────────────────
function StepBayar({
  payment,
  merchantName,
  nmid,
  onSuccess,
}: {
  payment: PendingPayment
  merchantName: string
  nmid: string
  onSuccess: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB')
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleUpload() {
    if (!file) {
      setError('Pilih foto bukti transfer terlebih dahulu')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('proof', file)
      fd.append('qrisPaymentId', payment.id)

      const res = await fetch('/api/checkout/qris/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal upload')
        return
      }
      onSuccess()
    } catch {
      setError('Gagal terhubung ke server. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Lakukan Transfer</h2>
        <p className="text-sm text-gray-500 mt-1">
          Scan QRIS di bawah, lalu transfer dengan nominal <strong>tepat</strong>
        </p>
      </div>

      {/* Nominal utama — menonjol */}
      <div className="bg-emerald-600 rounded-2xl p-6 text-center text-white">
        <p className="text-sm opacity-80 mb-1">Transfer TEPAT sebesar</p>
        <p className="text-4xl font-extrabold tracking-tight">{fmt(payment.totalAmount)}</p>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm opacity-90">
          <span>Harga paket: {fmt(payment.totalAmount - payment.uniqueCode)}</span>
          <span className="text-emerald-200">+</span>
          <span className="bg-white/20 px-2 py-0.5 rounded font-bold">
            Kode unik: {payment.uniqueCode}
          </span>
        </div>
        <p className="text-xs opacity-70 mt-2">
          Paket {PLAN_LABELS[payment.planType] ?? payment.planType} ·{' '}
          {CYCLE_LABELS[payment.billingCycle] ?? payment.billingCycle}
        </p>
      </div>

      {/* QRIS Static */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Scan QRIS Berikut
        </p>
        <div className="relative w-52 h-52">
          <Image
            src="/qris/qris-static.png"
            alt="QRIS Static Misi Pintar"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900">{merchantName}</p>
          {nmid && <p className="text-xs text-gray-400">NMID: {nmid}</p>}
        </div>
      </div>

      {/* Instruksi */}
      <ol className="text-sm text-gray-600 space-y-2 list-none">
        {[
          'Buka aplikasi mobile banking atau e-wallet Anda',
          'Scan QR code di atas',
          `Transfer tepat ${fmt(payment.totalAmount)} (nominal harus sama persis)`,
          'Screenshot bukti transfer Anda',
          'Upload bukti di bawah ini',
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {/* Upload bukti */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-5">
        <p className="font-semibold text-gray-700 mb-3">Upload Bukti Transfer</p>

        {preview ? (
          <div className="space-y-3">
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <button
              onClick={() => {
                setFile(null)
                setPreview(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Ganti foto
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-8 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Klik untuk pilih foto (JPG/PNG, maks 2MB)</span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {uploading ? 'Mengirim...' : 'Kirim Bukti Transfer'}
      </button>
    </div>
  )
}

// ── Step 3: Berhasil dikirim ──────────────────────────────────────────────────
function StepBerhasil() {
  return (
    <div className="text-center space-y-5 py-8">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bukti Terkirim!</h2>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
          Tim kami akan memverifikasi pembayaran Anda dalam 1×24 jam kerja. Langganan akan aktif
          otomatis setelah konfirmasi.
        </p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 text-left max-w-sm mx-auto">
        <p className="font-semibold mb-1">Yang perlu diingat:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Transfer harus sesuai nominal tepat</li>
          <li>Proses verifikasi 1×24 jam kerja</li>
          <li>Jika ada kendala, hubungi admin</li>
        </ul>
      </div>
      <Link
        href="/dashboard/billing"
        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
      >
        Kembali ke Billing
      </Link>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CheckoutClient({
  plans,
  defaultPlanType,
  defaultCycle,
  pendingPayment,
  nmid,
  merchantName,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'pilih' | 'bayar' | 'selesai'>(
    pendingPayment && !pendingPayment.proofImagePath
      ? 'bayar'
      : pendingPayment?.proofImagePath
      ? 'selesai'
      : 'pilih'
  )
  const [activePayment, setActivePayment] = useState<PendingPayment | null>(pendingPayment)

  function handlePilihNext(data: CheckoutData) {
    // Data sudah difetch di StepPilihPlan — tidak perlu fetch ulang
    setActivePayment({
      id: data.id,
      planType: data.planType,
      billingCycle: data.billingCycle,
      totalAmount: data.totalAmount,
      uniqueCode: data.uniqueCode,
      proofImagePath: null,
    })
    setStep('bayar')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard/billing" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Bayar via QRIS</h1>
            <p className="text-xs text-gray-400">Transfer manual · Verifikasi 1×24 jam</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {(['pilih', 'bayar', 'selesai'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-emerald-600 text-white'
                    : ['bayar', 'selesai'].indexOf(step) > ['pilih', 'bayar', 'selesai'].indexOf(s)
                    ? 'bg-emerald-200 text-emerald-700'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 'pilih' && (
            <StepPilihPlan
              plans={plans}
              defaultPlanType={defaultPlanType}
              defaultCycle={defaultCycle}
              onNext={handlePilihNext}
            />
          )}
          {step === 'bayar' && activePayment && (
            <StepBayar
              payment={activePayment}
              merchantName={merchantName}
              nmid={nmid}
              onSuccess={() => setStep('selesai')}
            />
          )}
          {step === 'selesai' && <StepBerhasil />}
        </div>
      </div>
    </div>
  )
}
