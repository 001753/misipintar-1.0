"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Family = {
  id: string;
  name: string;
  spaceCode: string;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
  subStatus: string;
  planName: string;
  childCount: number;
};

interface Props {
  families: Family[];
  subStatusColors: Record<string, string>;
  initialQuery: string;
}

export default function FamiliesClient({ families, subStatusColors, initialQuery }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/superadmin/families?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama keluarga, email, atau kode space..."
          className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Cari
        </button>
      </form>

      <p className="text-sm text-gray-500">{families.length} keluarga ditemukan</p>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Nama Keluarga</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Email Pemilik</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Kode</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Anak</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {families.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada hasil
                </td>
              </tr>
            ) : (
              families.map((f) => (
                <tr key={f.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-gray-300">{f.ownerEmail}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400 text-xs tracking-widest">
                    {f.spaceCode}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        subStatusColors[f.subStatus] ?? "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {f.subStatus} · {f.planName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{f.childCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/superadmin/families/${f.id}`}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
