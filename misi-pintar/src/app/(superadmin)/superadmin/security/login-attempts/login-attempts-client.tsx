"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { manualUnblockLogin } from "@/actions/admin";

type Attempt = {
  id: string;
  identifier: string;
  ipAddress: string;
  success: boolean;
  createdAt: string;
};

interface Props {
  attempts: Attempt[];
  blockedIdentifiers: string[];
  total: number;
  page: number;
  pageSize: number;
  initialQuery: string;
}

export default function LoginAttemptsClient({
  attempts,
  blockedIdentifiers,
  total,
  page,
  pageSize,
  initialQuery,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / pageSize);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/superadmin/security/login-attempts?${params.toString()}`);
  }

  function handleUnblock(identifier: string) {
    if (!confirm(`Unblock "${identifier}"? Ini akan menghapus semua LoginAttempt dan mereset Redis counter.\n\nAksi ini dicatat di AdminAuditLog.`)) return;
    startTransition(async () => {
      const res = await manualUnblockLogin(identifier);
      if (res.success) {
        showToast(`Identifier "${identifier}" berhasil di-unblock`);
        router.refresh();
      } else {
        showToast("Gagal: " + res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari identifier (email/username:spaceCode) atau IP..."
          className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-medium"
        >
          Cari
        </button>
      </form>

      <p className="text-xs text-gray-500">{total} percobaan ditemukan</p>

      {/* Unblock buttons untuk yang diblokir */}
      {blockedIdentifiers.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-white mb-3">Unblock Manual</p>
          <div className="flex flex-wrap gap-2">
            {blockedIdentifiers.map((id) => (
              <button
                key={id}
                onClick={() => handleUnblock(id)}
                disabled={isPending}
                className="text-xs flex items-center gap-2 bg-red-900/30 hover:bg-red-900/60 border border-red-700 text-red-400 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
              >
                🔓 {id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Identifier</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">IP Address</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Waktu</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada percobaan login
                </td>
              </tr>
            ) : (
              attempts.map((a) => {
                const isBlocked = blockedIdentifiers.includes(a.identifier);
                return (
                  <tr key={a.id} className={`hover:bg-gray-700/40 transition-colors ${isBlocked ? "bg-red-900/10" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className={isBlocked ? "text-red-400" : "text-gray-300"}>{a.identifier}</span>
                      {isBlocked && (
                        <span className="ml-2 text-xs bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded">BLOCKED</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{a.ipAddress}</td>
                    <td className="px-4 py-3">
                      {a.success ? (
                        <span className="text-xs text-emerald-400 font-semibold">✓ Berhasil</span>
                      ) : (
                        <span className="text-xs text-red-400 font-semibold">✕ Gagal</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      {!a.success && (
                        <button
                          onClick={() => handleUnblock(a.identifier)}
                          disabled={isPending}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-cyan-400 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Unblock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
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
                if (query.trim()) params.set("q", query.trim());
                params.set("page", String(p));
                router.push(`/superadmin/security/login-attempts?${params.toString()}`);
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
