"use client";

import { useState, useTransition } from "react";
import {
  updatePlanPrice,
  updatePlanLimits,
  togglePlanActive,
  updatePhaseMode,
} from "@/actions/admin";

type Plan = {
  id: string;
  type: string;
  name: string;
  price: number;
  yearlyPrice: number;
  isActive: boolean;
  limits: Record<string, unknown>;
};

interface Props {
  plans: Plan[];
  currentPhaseMode: string;
}

const PHASE_OPTIONS = [
  { value: "FULL_FREE", label: "Full Free — semua fitur gratis", description: "Tidak ada paywall, semua dapat Starter plan" },
  { value: "FREEMIUM", label: "Freemium — Starter gratis, Pro bayar", description: "Batasi fitur Starter, unlock lewat berlangganan" },
  { value: "PAID_ONLY", label: "Paid Only — harus berlangganan", description: "Setelah trial, semua harus bayar" },
];

export default function PlanManagerClient({ plans, currentPhaseMode }: Props) {
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState({ price: 0, yearlyPrice: 0 });
  const [limitForm, setLimitForm] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [phase, setPhase] = useState(currentPhaseMode);
  const [isPending, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function startEditPrice(plan: Plan) {
    setEditingPriceId(plan.id);
    setPriceForm({ price: plan.price, yearlyPrice: plan.yearlyPrice });
  }

  function startEditLimits(plan: Plan) {
    setEditingLimitId(plan.id);
    setLimitForm(JSON.stringify(plan.limits, null, 2));
  }

  function handleSavePrice(planId: string) {
    startTransition(async () => {
      const res = await updatePlanPrice(planId, priceForm.price, priceForm.yearlyPrice);
      if (res.success) {
        showToast("Harga berhasil diupdate");
        setEditingPriceId(null);
      } else {
        showToast("Gagal: " + res.error);
      }
    });
  }

  function handleSaveLimits(planId: string) {
    startTransition(async () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(limitForm);
      } catch {
        showToast("JSON tidak valid!");
        return;
      }
      const res = await updatePlanLimits(planId, parsed);
      if (res.success) {
        showToast("Limits berhasil diupdate");
        setEditingLimitId(null);
      } else {
        showToast("Gagal: " + res.error);
      }
    });
  }

  function handleToggleActive(planId: string, isActive: boolean) {
    startTransition(async () => {
      const res = await togglePlanActive(planId, !isActive);
      if (res.success) showToast(`Plan ${!isActive ? "diaktifkan" : "dinonaktifkan"}`);
      else showToast("Gagal: " + res.error);
    });
  }

  function handlePhaseMode(mode: string) {
    startTransition(async () => {
      const res = await updatePhaseMode(mode as "FULL_FREE" | "FREEMIUM" | "PAID_ONLY");
      if (res.success) {
        setPhase(mode);
        showToast("Phase mode berhasil diubah");
      } else {
        showToast("Gagal: " + res.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Phase Mode Control */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Phase Mode</h2>
        <div className="space-y-3">
          {PHASE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                phase === opt.value
                  ? "border-emerald-500 bg-emerald-900/20"
                  : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <input
                type="radio"
                name="phaseMode"
                value={opt.value}
                checked={phase === opt.value}
                onChange={() => handlePhaseMode(opt.value)}
                disabled={isPending}
                className="mt-1"
              />
              <div>
                <p className="text-white font-medium text-sm">{opt.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Daftar Plan</h2>
        </div>
        <div className="divide-y divide-gray-700">
          {plans.map((plan) => (
            <div key={plan.id} className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-bold">{plan.name}</span>
                    <span className="text-xs font-mono bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {plan.type}
                    </span>
                    {!plan.isActive && (
                      <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                        Nonaktif
                      </span>
                    )}
                  </div>

                  {/* Price Edit */}
                  {editingPriceId === plan.id ? (
                    <div className="flex items-center gap-3 mt-3">
                      <div>
                        <label className="text-xs text-gray-400">Harga/bulan (IDR)</label>
                        <input
                          type="number"
                          value={priceForm.price}
                          onChange={(e) => setPriceForm((f) => ({ ...f, price: Number(e.target.value) }))}
                          className="block mt-1 bg-gray-700 border border-gray-600 text-white px-3 py-1.5 rounded-lg text-sm w-36"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Harga/tahun (IDR)</label>
                        <input
                          type="number"
                          value={priceForm.yearlyPrice}
                          onChange={(e) => setPriceForm((f) => ({ ...f, yearlyPrice: Number(e.target.value) }))}
                          className="block mt-1 bg-gray-700 border border-gray-600 text-white px-3 py-1.5 rounded-lg text-sm w-36"
                        />
                      </div>
                      <div className="flex items-end gap-2 pb-0.5 mt-5">
                        <button
                          onClick={() => handleSavePrice(plan.id)}
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span>
                        Bulanan:{" "}
                        <strong className="text-white">
                          {plan.price === 0 ? "Gratis" : `Rp ${plan.price.toLocaleString("id-ID")}`}
                        </strong>
                      </span>
                      <span>
                        Tahunan:{" "}
                        <strong className="text-white">
                          {plan.yearlyPrice === 0 ? "Gratis" : `Rp ${plan.yearlyPrice.toLocaleString("id-ID")}`}
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Limits Edit */}
                  {editingLimitId === plan.id ? (
                    <div className="mt-3">
                      <label className="text-xs text-gray-400 mb-1 block">Limits (JSON)</label>
                      <textarea
                        value={limitForm}
                        onChange={(e) => setLimitForm(e.target.value)}
                        rows={8}
                        className="w-full bg-gray-900 border border-gray-600 text-emerald-400 font-mono text-xs px-3 py-2 rounded-lg"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveLimits(plan.id)}
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Simpan Limits
                        </button>
                        <button
                          onClick={() => setEditingLimitId(null)}
                          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <pre className="text-xs text-gray-400 font-mono bg-gray-900 rounded-lg px-3 py-2 overflow-auto max-h-24">
                        {JSON.stringify(plan.limits, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => startEditPrice(plan)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Edit Harga
                  </button>
                  <button
                    onClick={() => startEditLimits(plan)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Edit Limits
                  </button>
                  <button
                    onClick={() => handleToggleActive(plan.id, plan.isActive)}
                    disabled={isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 ${
                      plan.isActive
                        ? "bg-red-900/40 hover:bg-red-900/60 text-red-400"
                        : "bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400"
                    }`}
                  >
                    {plan.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
