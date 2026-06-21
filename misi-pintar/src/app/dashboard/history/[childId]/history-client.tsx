"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

const TX_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  TASK_REWARD:    { label: "Reward Tugas",       emoji: "🏆", color: "text-emerald-600 bg-emerald-50" },
  SAVINGS_DEPOSIT:{ label: "Transfer ke Tabungan",emoji: "💰", color: "text-blue-600 bg-blue-50" },
  SAVINGS_WITHDRAW:{ label: "Tarik Tabungan",    emoji: "🏧", color: "text-orange-600 bg-orange-50" },
  CHARITY:        { label: "Transfer ke Sedekah", emoji: "🤲", color: "text-purple-600 bg-purple-50" },
  INTEREST:       { label: "Bunga Tabungan",      emoji: "📈", color: "text-cyan-600 bg-cyan-50" },
  TAX:            { label: "Pajak Virtual",       emoji: "📋", color: "text-red-600 bg-red-50" },
  FINE:           { label: "Denda",               emoji: "⚠️", color: "text-red-600 bg-red-50" },
  ADJUSTMENT:     { label: "Penyesuaian",         emoji: "🔄", color: "text-gray-600 bg-gray-100" },
};

const TX_TYPES = Object.keys(TX_LABELS);

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface Props {
  child: { id: string; name: string; avatar: string | null };
  entries: LedgerEntry[];
  total: number;
  currentPage: number;
  totalPages: number;
  filters: { type?: string; from?: string; to?: string };
  basePath: string;
  viewerRole: "PARENT" | "CHILD";
}

export default function HistoryClient({
  child,
  entries,
  total,
  currentPage,
  totalPages,
  filters,
  basePath,
  viewerRole,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      const merged = { page: "1", ...filters, ...overrides };
      Object.entries(merged).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      return `${basePath}?${params.toString()}`;
    },
    [filters, basePath]
  );

  const handleFilter = (key: string, value: string | undefined) => {
    router.push(buildUrl({ [key]: value, page: "1" }));
  };

  const handlePage = (p: number) => {
    router.push(buildUrl({ page: String(p) }));
  };

  return (
    <div className={viewerRole === "CHILD" ? "space-y-4 pt-2" : "max-w-3xl mx-auto p-6 space-y-6"}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {viewerRole === "PARENT" && (
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Kembali
          </button>
        )}
        <div>
          <h1 className={`font-bold ${viewerRole === "CHILD" ? "text-white text-xl" : "text-gray-900 text-2xl"}`}>
            {child.avatar ?? "🧒"} Riwayat Transaksi
            {viewerRole === "PARENT" && ` — ${child.name}`}
          </h1>
          <p className={`text-sm ${viewerRole === "CHILD" ? "text-emerald-100" : "text-gray-500"}`}>
            {total} transaksi total
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilter("type", undefined)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              !filters.type
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Semua
          </button>
          {TX_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => handleFilter("type", t)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filters.type === t
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {TX_LABELS[t]?.emoji} {TX_LABELS[t]?.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Dari</label>
            <input
              type="date"
              defaultValue={filters.from ?? ""}
              onChange={(e) => handleFilter("from", e.target.value || undefined)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Sampai</label>
            <input
              type="date"
              defaultValue={filters.to ?? ""}
              onChange={(e) => handleFilter("to", e.target.value || undefined)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          {(filters.from || filters.to || filters.type) && (
            <button
              onClick={() => router.push(basePath)}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1.5"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-gray-400 text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          entries.map((entry) => {
            const meta = TX_LABELS[entry.type] ?? { label: entry.type, emoji: "💳", color: "text-gray-600 bg-gray-100" };
            const isPositive = entry.amount > 0;
            const date = new Date(entry.createdAt);

            return (
              <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`text-xl w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 ${meta.color}`}>
                      {meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                      <p className="text-xs text-gray-500 truncate">{entry.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {date.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}
                      Rp {Math.abs(entry.amount).toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {entry.balanceBefore.toLocaleString("id-ID")} → {entry.balanceAfter.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          <button
            onClick={() => handlePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-sm rounded-xl bg-white shadow-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600 px-2">
            Halaman {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-sm rounded-xl bg-white shadow-sm border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
