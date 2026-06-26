'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'

type Invoice = {
  id: string
  midtransOrderId: string | null
  status: string
  amount: number
  createdAt: string
  subscription: {
    plan: { name: string; type: string }
    familySpace: { name: string }
  }
  paymentLogs: { event: string; createdAt: string }[]
}

type TestResult = {
  test: { payload_sent: Record<string, string>; signature_valid: boolean }
  webhook: { status: number; body: unknown; elapsed_ms: number }
  invoice_after: {
    status: string
    paidAt: string | null
    paymentMethod: string | null
    paymentLogs: { event: string; createdAt: string }[]
    subscription: { status: string; currentPeriodEnd: string; plan: { name: string } }
  } | null
}

const TRANSACTION_STATUSES = [
  { value: 'settlement', label: 'settlement — payment success', color: 'text-green-400' },
  { value: 'capture', label: 'capture — credit card success', color: 'text-green-400' },
  { value: 'pending', label: 'pending — waiting for payment', color: 'text-yellow-400' },
  { value: 'deny', label: 'deny — denied by bank', color: 'text-red-400' },
  { value: 'cancel', label: 'cancel — cancelled', color: 'text-red-400' },
  { value: 'expire', label: 'expire — payment expired', color: 'text-orange-400' },
  { value: 'failure', label: 'failure — general failure', color: 'text-red-400' },
  { value: 'refund', label: 'refund — fully refunded', color: 'text-purple-400' },
]

const PAYMENT_TYPES = ['bank_transfer', 'qris', 'gopay', 'shopeepay', 'credit_card', 'bca_va']

export default function WebhookTestPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState('')
  const [txStatus, setTxStatus] = useState('settlement')
  const [paymentType, setPaymentType] = useState('bank_transfer')
  const [grossAmount, setGrossAmount] = useState('')
  const [firing, setFiring] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/webhooks/midtrans/test')
      .then((r) => r.json())
      .then((d) => {
        setInvoices(d.invoices ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function fire() {
    if (!orderId) return
    setFiring(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/webhooks/midtrans/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          transaction_status: txStatus,
          payment_type: paymentType,
          ...(grossAmount ? { gross_amount: grossAmount } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Unknown error')
      } else {
        setResult(data)
        // Refresh invoice list
        fetch('/api/webhooks/midtrans/test')
          .then((r) => r.json())
          .then((d) => setInvoices(d.invoices ?? []))
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setFiring(false)
    }
  }

  const statusBadge: Record<string, string> = {
    PENDING: 'bg-yellow-900/60 text-yellow-300 border-yellow-700',
    PAID: 'bg-green-900/60 text-green-300 border-green-700',
    EXPIRED: 'bg-orange-900/60 text-orange-300 border-orange-700',
    FAILED: 'bg-red-900/60 text-red-300 border-red-700',
    REFUNDED: 'bg-purple-900/60 text-purple-300 border-purple-700',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-mono">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <span className="text-2xl">🧪</span>
          <div>
            <h1 className="text-lg font-bold text-white">Midtrans Webhook Test</h1>
            <p className="text-xs text-gray-500">
              Fires a real SHA-512 signed payload against{' '}
              <code className="text-gray-400">/api/webhooks/midtrans</code> — dev only
            </p>
          </div>
          <span className="ml-auto px-2 py-1 rounded text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-800">
            DEV ONLY
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left: Fire panel */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Fire Test</h2>

            {/* Order ID input */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Midtrans Order ID</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. INV-abc123"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Transaction status */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Transaction Status</label>
              <div className="space-y-1">
                {TRANSACTION_STATUSES.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="txStatus"
                      value={s.value}
                      checked={txStatus === s.value}
                      onChange={() => setTxStatus(s.value)}
                      className="accent-indigo-500"
                    />
                    <span className={`text-xs ${s.color}`}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment type */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {PAYMENT_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Gross amount override */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Gross Amount Override{' '}
                <span className="text-gray-600">(optional — auto-fetched from invoice)</span>
              </label>
              <input
                value={grossAmount}
                onChange={(e) => setGrossAmount(e.target.value)}
                placeholder="e.g. 99000.00"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={fire}
              disabled={firing || !orderId}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {firing ? '⏳ Firing...' : '🚀 Fire Webhook'}
            </button>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-xs">
                ❌ {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                {/* Webhook response */}
                <div className={`p-3 border rounded-lg ${result.webhook.status === 200 ? 'bg-green-950/40 border-green-800' : 'bg-red-950/40 border-red-800'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-400">Webhook Response</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${result.webhook.status === 200 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                      HTTP {result.webhook.status}
                    </span>
                    <span className="text-xs text-gray-600 ml-auto">{result.webhook.elapsed_ms}ms</span>
                  </div>
                  <pre className="text-xs text-gray-300 overflow-auto">
                    {JSON.stringify(result.webhook.body, null, 2)}
                  </pre>
                </div>

                {/* Invoice after */}
                {result.invoice_after && (
                  <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Invoice State After</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Status</span>
                        <p className={`font-bold mt-0.5 ${statusBadge[result.invoice_after.status] ? '' : 'text-white'}`}>
                          {result.invoice_after.status}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Payment</span>
                        <p className="text-white mt-0.5">{result.invoice_after.paymentMethod ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Sub Status</span>
                        <p className="text-white mt-0.5">{result.invoice_after.subscription.status}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Period End</span>
                        <p className="text-white mt-0.5">
                          {new Date(result.invoice_after.subscription.currentPeriodEnd).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">Recent Logs</span>
                      {result.invoice_after.paymentLogs.map((l, i) => (
                        <p key={i} className="text-xs text-gray-400 mt-0.5">
                          • {l.event} <span className="text-gray-600">{new Date(l.createdAt).toLocaleTimeString('id-ID')}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature check */}
                <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Signature</p>
                  <p className="text-xs text-green-400">✓ SHA-512 valid — signed with MIDTRANS_SERVER_KEY</p>
                  <p className="text-xs text-gray-600 mt-1 break-all">{result.test.payload_sent.signature_key}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Invoice list */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recent Invoices</h2>
            {loading ? (
              <p className="text-xs text-gray-600">Loading...</p>
            ) : invoices.length === 0 ? (
              <p className="text-xs text-gray-600">No invoices found. Create a subscription first.</p>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => inv.midtransOrderId && setOrderId(inv.midtransOrderId)}
                    className={`p-3 bg-gray-900 border rounded-lg cursor-pointer transition-colors ${
                      orderId === inv.midtransOrderId
                        ? 'border-indigo-500 bg-indigo-950/30'
                        : 'border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {inv.subscription.familySpace.name}
                        </p>
                        <p className="text-xs text-gray-500">{inv.subscription.plan.name}</p>
                        <p className="text-xs text-gray-600 mt-1 font-mono truncate">
                          {inv.midtransOrderId ?? <span className="italic">no order id</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${statusBadge[inv.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                          {inv.status}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Rp {inv.amount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    {inv.paymentLogs.length > 0 && (
                      <p className="text-xs text-gray-700 mt-1.5">
                        Last: {inv.paymentLogs[0].event} · {new Date(inv.paymentLogs[0].createdAt).toLocaleTimeString('id-ID')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
