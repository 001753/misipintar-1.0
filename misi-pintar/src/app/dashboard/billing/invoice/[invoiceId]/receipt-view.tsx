"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  orderId: string;
  issuedAt: string;
  paidAt: string | null;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  billingCycle: "MONTHLY" | "YEARLY";
  plan: { name: string; type: string };
  periodStart: string | null;
  periodEnd: string | null;
}

interface Customer {
  name: string;
  email: string | null;
  phone: string | null;
  familySpaceName: string;
}

interface Props {
  invoice: InvoiceData;
  customer: Customer;
}

// ── Helpers ───────────────────────────────────────────────────
function fmtIDR(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", opts ?? {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const PAY_METHOD_LABELS: Record<string, string> = {
  QRIS: "QRIS",
  GOPAY: "GoPay",
  SHOPEEPAY: "ShopeePay",
  BANK_TRANSFER: "Transfer Bank",
  CREDIT_CARD: "Kartu Kredit",
  VA: "Virtual Account",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PAID:    { label: "LUNAS",       bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  PENDING: { label: "MENUNGGU",    bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-400"   },
  EXPIRED: { label: "KADALUARSA", bg: "bg-gray-50",     text: "text-gray-500",    dot: "bg-gray-400"    },
  FAILED:  { label: "GAGAL",      bg: "bg-red-50",      text: "text-red-600",     dot: "bg-red-500"     },
};

const PLAN_ICONS: Record<string, string> = {
  STARTER: "🌱",
  PRO: "⚡",
  EDUCATOR: "🎓",
  SCHOOL: "🏫",
};

export default function ReceiptView({ invoice, customer }: Props) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const statusCfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.PENDING;
  const planIcon = PLAN_ICONS[invoice.plan.type] ?? "📋";
  const billingLabel = invoice.billingCycle === "YEARLY" ? "Tahunan" : "Bulanan";
  const payMethod = invoice.paymentMethod
    ? PAY_METHOD_LABELS[invoice.paymentMethod] ?? invoice.paymentMethod
    : "—";

  async function handleDownload() {
    setDlError(null);
    setDownloading(true);
    try {
      const res = await fetch(`/api/invoice/${invoice.id}/pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Gagal mengunduh PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Kuitansi-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDlError(e instanceof Error ? e.message : "Gagal mengunduh.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Kembali ke Billing
          </button>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">

          {/* ── Top gradient header ────────────────────────── */}
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 px-8 py-7 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-200 text-xs font-medium tracking-widest uppercase mb-1">
                  Misi Pintar
                </p>
                <h1 className="text-2xl font-black tracking-tight">Kuitansi Pembayaran</h1>
                <p className="text-emerald-200 text-sm mt-1 font-mono">{invoice.invoiceNumber}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </div>
            </div>
          </div>

          <div className="px-8 py-7 space-y-7">

            {/* ── Paid-for banner ────────────────────────────── */}
            {invoice.status === "PAID" && invoice.periodStart && invoice.periodEnd && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                <div>
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-0.5">
                    ✓ Langganan Aktif
                  </p>
                  <p className="text-sm text-emerald-800 font-medium">
                    {fmtDate(invoice.periodStart)} — {fmtDate(invoice.periodEnd)}
                  </p>
                </div>
                <span className="text-3xl">{planIcon}</span>
              </div>
            )}

            {/* ── Meta grid ─────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-5">
              <MetaField label="Ditagihkan kepada" value={customer.name} />
              <MetaField
                label="Kontak"
                value={customer.email ?? customer.phone ?? "—"}
              />
              <MetaField label="Ruang Keluarga" value={customer.familySpaceName} />
              <MetaField
                label="Metode Pembayaran"
                value={payMethod}
                highlight={!!invoice.paymentMethod}
              />
              <MetaField label="Tanggal Invoice" value={fmtDate(invoice.issuedAt)} />
              <MetaField
                label="Tanggal Dibayar"
                value={invoice.paidAt ? fmtDateTime(invoice.paidAt) : "—"}
                highlight={!!invoice.paidAt}
              />
            </div>

            {/* ── Items ─────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3 mb-1">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Deskripsi</span>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Jumlah</span>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {planIcon} Misi Pintar {invoice.plan.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Langganan {billingLabel}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 text-right">
                    {fmtIDR(invoice.amount)}
                  </p>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">PPN (0%)</span>
                  <span className="text-xs text-gray-400">Rp 0</span>
                </div>

                <div className="bg-emerald-600 px-5 py-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">TOTAL DIBAYAR</span>
                  <span className="text-lg font-black text-white">{fmtIDR(invoice.amount)}</span>
                </div>
              </div>
            </div>

            {/* ── Reference ─────────────────────────────────── */}
            <div className="bg-gray-50 rounded-2xl px-5 py-5 space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Referensi Pembayaran
              </p>
              <RefRow label="Nomor Invoice" value={invoice.invoiceNumber} mono />
              {invoice.orderId && (
                <RefRow label="Order ID Midtrans" value={invoice.orderId} mono />
              )}
              <RefRow label="Platform" value="Midtrans · PT Midtrans" />
              <RefRow label="Mata Uang" value={invoice.currency} />
            </div>

            {/* ── Error ─────────────────────────────────────── */}
            {dlError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
                <span>{dlError}</span>
                <button onClick={() => setDlError(null)} className="font-bold ml-2">✕</button>
              </div>
            )}

            {/* ── Actions ───────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {downloading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Membuat PDF...
                  </>
                ) : (
                  <>
                    ↓ Unduh Kuitansi PDF
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors print:hidden"
              >
                🖨 Cetak
              </button>
            </div>

          </div>

          {/* ── Footer ────────────────────────────────────── */}
          <div className="border-t border-gray-100 px-8 py-5 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">Misi Pintar</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Dokumen ini merupakan bukti pembayaran yang sah secara digital.
              </p>
            </div>
            <p className="text-xs text-gray-300 font-mono text-right">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Dicetak pada {fmtDateTime(new Date().toISOString())} ·{" "}
          <Link href="/dashboard/billing" className="underline underline-offset-2 hover:text-gray-600">
            Kembali ke Billing
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────
function MetaField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-gray-900" : "text-gray-700"}`}>
        {value}
      </p>
    </div>
  );
}

function RefRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-xs text-gray-700 text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
