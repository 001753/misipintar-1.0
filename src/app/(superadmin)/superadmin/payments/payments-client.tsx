"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { manualRefundInvoice } from "@/actions/admin";

type Invoice = {
  id: string;
  status: string;
  amount: number;
  providerInvoiceNumber: string;
  paymentProvider: string;
  paymentMethod: string | null;
  paidAt: string | null;
  expiredAt: string;
  createdAt: string;
  familyName: string;
  planName: string;
  lastEvent: string | null;
};

interface Props {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-900/40 text-yellow-400",
  PAID: "bg-emerald-900/40 text-emerald-400",
  EXPIRED: "bg-gray-700 text-gray-400",
  FAILED: "bg-red-900/40 text-red-400",
  REFUNDED: "bg-blue-900/40 text-blue-400",
};

const STATUS_FILTERS = ["ALL", "PENDING", "PAID", "EXPIRED", "FAILED", "REFUNDED"];

export default function PaymentsClient({ invoices, total, page, pageSize, currentStatus }: Props) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(total / pageSize);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function setFilter(status: string) {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    router.push(`/superadmin/payments?${params.toString()}`);
  }

  function handleRefund(invoiceId: string, amount: number) {
    if (!confirm(`Refund invoice Rp ${amount.toLocaleString("id-ID")}? Aksi ini dicatat di Audit Log.`)) return;
    startTransition(async () => {
      const res = await manualRefundInvoice(invoiceId);
      showToast(res.success ? "Refund berhasil dicatat" : "Gagal: " + res.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              currentStatus === s
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{total} invoice</span>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Keluarga / Plan</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">Jumlah</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Provider / Referensi</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Tanggal</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada invoice
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-700/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{inv.familyName}</p>
                    <p className="text-gray-400 text-xs">{inv.planName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] ?? "bg-gray-700 text-gray-400"}`}>
                      {inv.status}
                    </span>
                    {inv.lastEvent && (
                      <p className="text-gray-500 text-xs font-mono mt-0.5">{inv.lastEvent}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    Rp {inv.amount.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {inv.paymentProvider} · {inv.providerInvoiceNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(inv.createdAt).toLocaleDateString("id-ID")}
                    {inv.paidAt && (
                      <div className="text-emerald-500">✓ {new Date(inv.paidAt).toLocaleDateString("id-ID")}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "PAID" && (
                      <button
                        onClick={() => handleRefund(inv.id, inv.amount)}
                        disabled={isPending}
                        className="text-xs bg-blue-900/40 hover:bg-blue-900/70 text-blue-400 px-3 py-1 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams();
                if (currentStatus !== "ALL") params.set("status", currentStatus);
                params.set("page", String(p));
                router.push(`/superadmin/payments?${params.toString()}`);
              }}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${
                p === page ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
