"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  forceUpgradeSubscription,
  forceExpireSubscription,
  suspendFamilySpace,
} from "@/actions/admin";

type Child = {
  id: string;
  name: string;
  username: string;
  balance: number;
  savingsBalance: number;
  deletedAt: string | null;
};

type Invoice = {
  id: string;
  status: string;
  amount: number;
  midtransOrderId: string;
  paidAt: string | null;
  createdAt: string;
  paymentLogs: { id: string; event: string; createdAt: string }[];
};

type Family = {
  id: string;
  name: string;
  spaceCode: string;
  ownerEmail: string;
  ownerName: string;
  ownerCreatedAt: string;
  children: Child[];
  subscription: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    planName: string;
    planType: string;
    invoices: Invoice[];
  } | null;
};

const INV_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400",
  PAID: "text-emerald-400",
  EXPIRED: "text-gray-400",
  FAILED: "text-red-400",
  REFUNDED: "text-blue-400",
};

export default function FamilyDetailClient({ family }: { family: Family }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspend, setShowSuspend] = useState(false);
  const [isPending, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function handleUpgrade(planType: "STARTER" | "PRO" | "EDUCATOR" | "SCHOOL") {
    if (!confirm(`Force upgrade ke ${planType}? Ini akan menimpa subscription aktif.`)) return;
    startTransition(async () => {
      const res = await forceUpgradeSubscription(family.id, planType);
      showToast(res.success ? `Force upgrade ke ${planType} berhasil` : "Gagal: " + res.error);
      if (res.success) router.refresh();
    });
  }

  function handleForceExpire() {
    if (!confirm("Force expire subscription ini? Keluarga akan kehilangan akses premium.")) return;
    startTransition(async () => {
      const res = await forceExpireSubscription(family.id);
      showToast(res.success ? "Subscription berhasil di-expire" : "Gagal: " + res.error);
      if (res.success) router.refresh();
    });
  }

  function handleSuspend() {
    if (!suspendReason.trim()) { showToast("Alasan suspensi wajib diisi"); return; }
    if (!confirm(`Suspend keluarga "${family.name}"? Aksi ini akan dicatat di AdminAuditLog.`)) return;
    startTransition(async () => {
      const res = await suspendFamilySpace(family.id, suspendReason);
      showToast(res.success ? "Keluarga berhasil disuspend" : "Gagal: " + res.error);
      if (res.success) { setShowSuspend(false); router.refresh(); }
    });
  }

  const sub = family.subscription;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Info Dasar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Informasi Pemilik</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-gray-500 w-28">Nama:</dt><dd className="text-white">{family.ownerName}</dd></div>
            <div className="flex gap-2"><dt className="text-gray-500 w-28">Email:</dt><dd className="text-white">{family.ownerEmail}</dd></div>
            <div className="flex gap-2"><dt className="text-gray-500 w-28">Terdaftar:</dt><dd className="text-gray-300">{new Date(family.ownerCreatedAt).toLocaleDateString("id-ID")}</dd></div>
          </dl>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Status Langganan</h2>
          {sub ? (
            <dl className="space-y-1.5 text-sm">
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Plan:</dt><dd className="text-white font-semibold">{sub.planName}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Status:</dt><dd className="text-emerald-400 font-semibold">{sub.status}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-28">Berlaku:</dt><dd className="text-gray-300">{sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString("id-ID") : "-"} — {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("id-ID") : "-"}</dd></div>
            </dl>
          ) : (
            <p className="text-gray-500 text-sm">Belum ada subscription.</p>
          )}
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-gray-800 border border-amber-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-amber-400 mb-4">⚠️ Aksi Admin (Dicatat di Audit Log)</h2>
        <div className="flex flex-wrap gap-3">
          {(["STARTER", "PRO", "EDUCATOR", "SCHOOL"] as const).map((pt) => (
            <button
              key={pt}
              onClick={() => handleUpgrade(pt)}
              disabled={isPending}
              className="text-xs bg-gray-700 hover:bg-emerald-800 text-gray-200 hover:text-emerald-200 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              Force → {pt}
            </button>
          ))}
          <button
            onClick={handleForceExpire}
            disabled={isPending}
            className="text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            Force Expire
          </button>
          <button
            onClick={() => setShowSuspend(!showSuspend)}
            className="text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Suspend
          </button>
        </div>

        {showSuspend && (
          <div className="mt-4 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Alasan Suspensi (wajib)</label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Contoh: Pelanggaran TOS §3.2"
                className="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={handleSuspend}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
            >
              Konfirmasi Suspend
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Daftar Anak ({family.children.length})</h2>
        {family.children.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada anak terdaftar.</p>
        ) : (
          <div className="space-y-2">
            {family.children.map((c) => (
              <div key={c.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${c.deletedAt ? "bg-gray-900/50 opacity-50" : "bg-gray-900"}`}>
                <div>
                  <span className="text-white text-sm font-medium">{c.name}</span>
                  <span className="text-gray-400 text-xs ml-2">@{c.username}</span>
                  {c.deletedAt && <span className="text-red-400 text-xs ml-2">[dihapus]</span>}
                </div>
                <div className="text-sm text-right">
                  <span className="text-emerald-400 font-medium">Rp {c.balance.toLocaleString("id-ID")}</span>
                  {c.savingsBalance > 0 && <span className="text-blue-400 ml-3 text-xs">Tabungan: Rp {c.savingsBalance.toLocaleString("id-ID")}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice History */}
      {sub && sub.invoices.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Riwayat Invoice</h2>
          <div className="space-y-2">
            {sub.invoices.map((inv) => (
              <div key={inv.id} className="bg-gray-900 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-bold ${INV_STATUS_COLORS[inv.status] ?? "text-gray-400"}`}>
                      {inv.status}
                    </span>
                    <span className="text-white text-sm font-medium ml-3">
                      Rp {inv.amount.toLocaleString("id-ID")}
                    </span>
                    {inv.midtransOrderId && (
                      <span className="text-gray-500 text-xs ml-3 font-mono">{inv.midtransOrderId}</span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(inv.createdAt).toLocaleDateString("id-ID")}
                    {inv.paidAt && ` · Bayar: ${new Date(inv.paidAt).toLocaleDateString("id-ID")}`}
                  </span>
                </div>
                {inv.paymentLogs.length > 0 && (
                  <div className="mt-1.5 flex gap-2 flex-wrap">
                    {inv.paymentLogs.map((pl) => (
                      <span key={pl.id} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
                        {pl.event}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
