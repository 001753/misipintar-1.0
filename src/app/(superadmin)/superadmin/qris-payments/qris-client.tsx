'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

type Payment = {
  id: string
  familyName: string
  spaceCode: string
  planType: string
  billingCycle: string
  baseAmount: number
  uniqueCode: number
  totalAmount: number
  proofImagePath: string | null
  status: string
  adminNote: string | null
  reviewedAt: string | null
  createdAt: string
}

interface Props {
  payments: Payment[]
  total: number
  page: number
  pageSize: number
  currentStatus: string
}

function fmt(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-600' },
}

const PLAN_LABELS: Record<string, string> = {
  PRO: 'Pro',
  EDUCATOR: 'Educator',
  SCHOOL: 'School',
}

// ── Modal proof image ──────────────────────────────────────────────────────────
function ProofModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-white rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <p className="font-semibold text-gray-900">Bukti Transfer</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="relative w-full" style={{ minHeight: 300 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Bukti Transfer" className="w-full h-auto max-h-[70vh] object-contain" />
        </div>
      </div>
    </div>
  )
}

// ── Modal reject ───────────────────────────────────────────────────────────────
function RejectModal({
  payment,
  onConfirm,
  onCancel,
  loading,
}: {
  payment: Payment
  onConfirm: (note: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Tolak Pembayaran?</h3>
        <p className="text-sm text-gray-500">
          Pembayaran dari keluarga <strong>{payment.familyName}</strong> sebesar{' '}
          <strong>{fmt(payment.totalAmount)}</strong> akan ditolak.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alasan penolakan <span className="text-gray-400">(opsional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Nominal tidak sesuai, bukti tidak jelas, dll."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? 'Menolak...' : 'Tolak Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Kartu satu pembayaran ──────────────────────────────────────────────────────
function PaymentCard({
  payment,
  onAction,
}: {
  payment: Payment
  onAction: (id: string, action: 'APPROVE' | 'REJECT', note?: string) => Promise<void>
}) {
  const [proofSrc, setProofSrc] = useState<string | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [loading, setLoading] = useState(false)

  const status = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.PENDING
  const isPending = payment.status === 'PENDING'

  async function handleApprove() {
    setLoading(true)
    await onAction(payment.id, 'APPROVE')
    setLoading(false)
  }

  async function handleReject(note: string) {
    setLoading(true)
    await onAction(payment.id, 'REJECT', note)
    setLoading(false)
    setShowReject(false)
  }

  return (
    <>
      {proofSrc && <ProofModal src={proofSrc} onClose={() => setProofSrc(null)} />}
      {showReject && (
        <RejectModal
          payment={payment}
          onConfirm={handleReject}
          onCancel={() => setShowReject(false)}
          loading={loading}
        />
      )}

      <div
        className={`bg-gray-800 border rounded-xl p-5 transition-all ${
          isPending ? 'border-amber-500/40' : 'border-gray-700'
        }`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-white">{payment.familyName}</p>
              <span className="text-xs text-gray-500 font-mono">{payment.spaceCode}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                {status.label}
              </span>
              <span className="text-xs text-gray-400">
                {PLAN_LABELS[payment.planType] ?? payment.planType} ·{' '}
                {payment.billingCycle === 'YEARLY' ? 'Tahunan' : 'Bulanan'}
              </span>
            </div>
          </div>

          {/* Nominal */}
          <div className="text-right">
            <p className="text-2xl font-extrabold text-emerald-400">{fmt(payment.totalAmount)}</p>
            <p className="text-xs text-gray-500">
              {fmt(payment.baseAmount)} +{' '}
              <span className="text-amber-400 font-bold">kode {payment.uniqueCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Bukti + tanggal */}
          <div className="flex items-center gap-3">
            {payment.proofImagePath ? (
              <button
                onClick={() => setProofSrc(payment.proofImagePath!)}
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Lihat Bukti
              </button>
            ) : (
              <span className="text-xs text-gray-500 italic">Belum ada bukti</span>
            )}
            <span className="text-xs text-gray-500">
              {new Date(payment.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Aksi */}
          {isPending && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReject(true)}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-red-700 text-red-400 hover:bg-red-900/30 disabled:opacity-50 transition-colors"
              >
                Tolak
              </button>
              <button
                onClick={handleApprove}
                disabled={loading || !payment.proofImagePath}
                title={!payment.proofImagePath ? 'Tunggu user upload bukti transfer' : ''}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors"
              >
                {loading ? '...' : 'Approve ✓'}
              </button>
            </div>
          )}

          {/* Status setelah diproses */}
          {!isPending && payment.adminNote && (
            <p className="text-xs text-gray-500 italic max-w-xs truncate">
              &ldquo;{payment.adminNote}&rdquo;
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main Client ────────────────────────────────────────────────────────────────
export default function QrisPaymentsClient({
  payments: initialPayments,
  total,
  page,
  pageSize,
  currentStatus,
}: Props) {
  const router = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleAction(id: string, action: 'APPROVE' | 'REJECT', note?: string) {
    try {
      const res = await fetch('/api/admin/qris-payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, adminNote: note }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error ?? 'Gagal memproses', 'error')
        return
      }
      // Update lokal tanpa full reload
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                adminNote: note ?? p.adminNote,
                reviewedAt: new Date().toISOString(),
              }
            : p
        )
      )
      showToast(
        action === 'APPROVE' ? 'Pembayaran disetujui & langganan diaktifkan!' : 'Pembayaran ditolak.',
        action === 'APPROVE' ? 'success' : 'error'
      )
      startTransition(() => router.refresh())
    } catch {
      showToast('Gagal terhubung ke server', 'error')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  function setStatus(s: string) {
    const params = new URLSearchParams({ status: s, page: '1' })
    router.push(`/superadmin/qris-payments?${params}`)
  }

  function setPage(p: number) {
    const params = new URLSearchParams({ status: currentStatus, page: String(p) })
    router.push(`/superadmin/qris-payments?${params}`)
  }

  const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'ALL']

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg font-medium text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStatus === s
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {s === 'PENDING'
              ? 'Menunggu'
              : s === 'APPROVED'
              ? 'Disetujui'
              : s === 'REJECTED'
              ? 'Ditolak'
              : 'Semua'}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{total} transaksi</span>
      </div>

      {/* Daftar */}
      {payments.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p>Tidak ada pembayaran {currentStatus === 'PENDING' ? 'yang menunggu' : 'di sini'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <PaymentCard key={p.id} payment={p} onAction={handleAction} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
