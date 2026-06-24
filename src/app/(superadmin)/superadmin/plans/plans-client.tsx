"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updatePlanPrice,
  updatePlanLimits,
  togglePlanActive,
  updatePhaseMode,
} from "@/actions/admin";

type PlanLimits = {
  maxChildren: number;
  maxTasksPerMonth: number;
  maxFamilies?: number;
  hasTax: boolean;
  taxRate?: number;
  hasInterest: boolean;
  interestRate?: number;
  sso?: boolean;
};

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
  {
    value: "FULL_FREE",
    label: "Full Free",
    description: "Semua fitur gratis — tidak ada paywall, semua keluarga dapat Starter plan",
    icon: "🎁",
  },
  {
    value: "FREEMIUM",
    label: "Freemium",
    description: "Starter gratis, Pro & atas wajib berlangganan",
    icon: "⚡",
  },
  {
    value: "PAID_ONLY",
    label: "Berbayar Penuh",
    description: "Setelah masa trial habis, semua keluarga harus berlangganan",
    icon: "💳",
  },
];

const PLAN_ICONS: Record<string, string> = {
  STARTER: "🌱",
  PRO: "🚀",
  EDUCATOR: "🎓",
  SCHOOL: "🏫",
};

function parseLimits(raw: Record<string, unknown>): PlanLimits {
  return {
    maxChildren: typeof raw.maxChildren === "number" ? raw.maxChildren : 2,
    maxTasksPerMonth: typeof raw.maxTasksPerMonth === "number" ? raw.maxTasksPerMonth : 10,
    maxFamilies: typeof raw.maxFamilies === "number" ? raw.maxFamilies : undefined,
    hasTax: Boolean(raw.hasTax),
    taxRate: typeof raw.taxRate === "number" ? raw.taxRate : 5,
    hasInterest: Boolean(raw.hasInterest),
    interestRate: typeof raw.interestRate === "number" ? raw.interestRate : 2,
    sso: Boolean(raw.sso),
  };
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
      <span>✓</span> {msg}
    </div>
  );
}

function ErrorToast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2">
      <span>✕</span> {msg}
    </div>
  );
}

function LimitsDisplay({ limits }: { limits: Record<string, unknown> }) {
  const l = parseLimits(limits);
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
      <div className="flex items-center gap-2 text-gray-300">
        <span className="text-gray-500">👥</span>
        <span>Maks. Anak:</span>
        <span className="font-semibold text-white">
          {l.maxChildren === -1 ? "Tak Terbatas" : l.maxChildren}
        </span>
      </div>
      <div className="flex items-center gap-2 text-gray-300">
        <span className="text-gray-500">📋</span>
        <span>Maks. Tugas/Bulan:</span>
        <span className="font-semibold text-white">
          {l.maxTasksPerMonth === -1 ? "Tak Terbatas" : l.maxTasksPerMonth}
        </span>
      </div>
      {l.maxFamilies !== undefined && (
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-gray-500">🏠</span>
          <span>Maks. Keluarga:</span>
          <span className="font-semibold text-white">
            {l.maxFamilies === -1 ? "Tak Terbatas" : l.maxFamilies}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 text-gray-300">
        <span className={l.hasTax ? "text-emerald-400" : "text-gray-600"}>
          {l.hasTax ? "✓" : "✕"}
        </span>
        <span>Fitur Pajak</span>
        {l.hasTax && l.taxRate !== undefined && (
          <span className="text-gray-400 text-xs">({l.taxRate}%)</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-gray-300">
        <span className={l.hasInterest ? "text-emerald-400" : "text-gray-600"}>
          {l.hasInterest ? "✓" : "✕"}
        </span>
        <span>Bunga Tabungan</span>
        {l.hasInterest && l.interestRate !== undefined && (
          <span className="text-gray-400 text-xs">({l.interestRate}%/bln)</span>
        )}
      </div>
      {l.sso !== undefined && (
        <div className="flex items-center gap-2 text-gray-300">
          <span className={l.sso ? "text-emerald-400" : "text-gray-600"}>
            {l.sso ? "✓" : "✕"}
          </span>
          <span>SSO Login</span>
        </div>
      )}
    </div>
  );
}

function LimitsEditor({
  initial,
  planType,
  onSave,
  onCancel,
  isPending,
}: {
  initial: Record<string, unknown>;
  planType: string;
  onSave: (limits: Record<string, unknown>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [l, setL] = useState<PlanLimits>(parseLimits(initial));

  const showFamilies = planType === "EDUCATOR" || planType === "SCHOOL";
  const showSso = planType === "SCHOOL";

  function toggle(field: keyof PlanLimits) {
    setL((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function num(field: keyof PlanLimits, val: string) {
    setL((prev) => ({ ...prev, [field]: val === "" ? 0 : Number(val) }));
  }

  function handleSave() {
    const result: Record<string, unknown> = {
      maxChildren: l.maxChildren,
      maxTasksPerMonth: l.maxTasksPerMonth,
      hasTax: l.hasTax,
      hasInterest: l.hasInterest,
    };
    if (l.hasTax) result.taxRate = l.taxRate ?? 5;
    if (l.hasInterest) result.interestRate = l.interestRate ?? 2;
    if (showFamilies) result.maxFamilies = l.maxFamilies ?? -1;
    if (showSso) result.sso = l.sso ?? false;
    onSave(result);
  }

  const inputCls =
    "bg-gray-900 border border-gray-600 text-white px-3 py-1.5 rounded-lg text-sm w-20 focus:outline-none focus:border-emerald-500";
  const checkCls =
    "w-4 h-4 rounded accent-emerald-500 cursor-pointer";

  return (
    <div className="mt-4 bg-gray-900/60 border border-gray-600 rounded-xl p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-300 mb-1">Edit Fitur & Batas</p>

      {/* maxChildren */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 w-44">Maks. Anak</span>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            className={checkCls}
            checked={l.maxChildren === -1}
            onChange={() => setL((p) => ({ ...p, maxChildren: p.maxChildren === -1 ? 2 : -1 }))}
          />
          Tak Terbatas
        </label>
        {l.maxChildren !== -1 && (
          <input
            type="number"
            min={1}
            value={l.maxChildren}
            onChange={(e) => num("maxChildren", e.target.value)}
            className={inputCls}
          />
        )}
      </div>

      {/* maxTasksPerMonth */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 w-44">Maks. Tugas/Bulan</span>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            className={checkCls}
            checked={l.maxTasksPerMonth === -1}
            onChange={() => setL((p) => ({ ...p, maxTasksPerMonth: p.maxTasksPerMonth === -1 ? 10 : -1 }))}
          />
          Tak Terbatas
        </label>
        {l.maxTasksPerMonth !== -1 && (
          <input
            type="number"
            min={1}
            value={l.maxTasksPerMonth}
            onChange={(e) => num("maxTasksPerMonth", e.target.value)}
            className={inputCls}
          />
        )}
      </div>

      {/* maxFamilies (Educator/School) */}
      {showFamilies && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 w-44">Maks. Keluarga</span>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              className={checkCls}
              checked={(l.maxFamilies ?? -1) === -1}
              onChange={() =>
                setL((p) => ({ ...p, maxFamilies: (p.maxFamilies ?? -1) === -1 ? 10 : -1 }))
              }
            />
            Tak Terbatas
          </label>
          {(l.maxFamilies ?? -1) !== -1 && (
            <input
              type="number"
              min={1}
              value={l.maxFamilies ?? 10}
              onChange={(e) => num("maxFamilies", e.target.value)}
              className={inputCls}
            />
          )}
        </div>
      )}

      {/* hasTax */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 w-44">Fitur Pajak</span>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            className={checkCls}
            checked={l.hasTax}
            onChange={() => toggle("hasTax")}
          />
          Aktif
        </label>
        {l.hasTax && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={l.taxRate ?? 5}
              onChange={(e) => num("taxRate", e.target.value)}
              className={inputCls}
            />
            <span className="text-gray-400 text-sm">%</span>
          </div>
        )}
      </div>

      {/* hasInterest */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 w-44">Bunga Tabungan</span>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            className={checkCls}
            checked={l.hasInterest}
            onChange={() => toggle("hasInterest")}
          />
          Aktif
        </label>
        {l.hasInterest && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={l.interestRate ?? 2}
              onChange={(e) => num("interestRate", e.target.value)}
              className={inputCls}
            />
            <span className="text-gray-400 text-sm">% / bulan</span>
          </div>
        )}
      </div>

      {/* sso (School only) */}
      {showSso && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 w-44">SSO Login</span>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              className={checkCls}
              checked={l.sso ?? false}
              onChange={() => toggle("sso")}
            />
            Aktif
          </label>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 transition-colors font-medium"
        >
          {isPending ? "Menyimpan…" : "Simpan Fitur"}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

function PriceEditor({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: { price: number; yearlyPrice: number };
  onSave: (price: number, yearlyPrice: number) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [price, setPrice] = useState(initial.price);
  const [yearly, setYearly] = useState(initial.yearlyPrice);

  return (
    <div className="mt-3 bg-gray-900/60 border border-gray-600 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-300">Edit Harga</p>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Harga Bulanan (Rp)</label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm w-40 focus:outline-none focus:border-emerald-500"
            placeholder="0 = Gratis"
          />
          <p className="text-xs text-gray-500 mt-1">
            {price === 0 ? "Gratis" : `Rp ${price.toLocaleString("id-ID")}/bulan`}
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Harga Tahunan (Rp)</label>
          <input
            type="number"
            min={0}
            value={yearly}
            onChange={(e) => setYearly(Number(e.target.value))}
            className="bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm w-40 focus:outline-none focus:border-emerald-500"
            placeholder="0 = Gratis"
          />
          <p className="text-xs text-gray-500 mt-1">
            {yearly === 0 ? "Gratis" : `Rp ${yearly.toLocaleString("id-ID")}/tahun`}
          </p>
        </div>
      </div>
      <div className="flex gap-2 pt-1 border-t border-gray-700">
        <button
          onClick={() => onSave(price, yearly)}
          disabled={isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 transition-colors font-medium"
        >
          {isPending ? "Menyimpan…" : "Simpan Harga"}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

export default function PlanManagerClient({ plans, currentPhaseMode }: Props) {
  const router = useRouter();
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [phase, setPhase] = useState(currentPhaseMode);
  const [isPending, startTransition] = useTransition();

  function ok(msg: string) {
    setToast(msg);
    setErrorToast(null);
    setTimeout(() => setToast(null), 4000);
  }
  function err(msg: string) {
    setErrorToast(msg);
    setToast(null);
    setTimeout(() => setErrorToast(null), 5000);
  }

  function handleSavePrice(planId: string, price: number, yearlyPrice: number) {
    startTransition(async () => {
      const res = await updatePlanPrice(planId, price, yearlyPrice);
      if (res.success) {
        ok("Harga berhasil disimpan");
        setEditingPriceId(null);
        router.refresh();
      } else {
        err("Gagal: " + res.error);
      }
    });
  }

  function handleSaveLimits(planId: string, limits: Record<string, unknown>) {
    startTransition(async () => {
      const res = await updatePlanLimits(planId, limits);
      if (res.success) {
        ok("Fitur & batas berhasil disimpan");
        setEditingLimitId(null);
        router.refresh();
      } else {
        err("Gagal: " + res.error);
      }
    });
  }

  function handleToggleActive(planId: string, isActive: boolean) {
    startTransition(async () => {
      const res = await togglePlanActive(planId, !isActive);
      if (res.success) {
        ok(`Plan berhasil ${!isActive ? "diaktifkan" : "dinonaktifkan"}`);
        router.refresh();
      } else {
        err("Gagal: " + res.error);
      }
    });
  }

  function handlePhaseMode(mode: string) {
    startTransition(async () => {
      const res = await updatePhaseMode(mode as "FULL_FREE" | "FREEMIUM" | "PAID_ONLY");
      if (res.success) {
        setPhase(mode);
        ok("Mode monetisasi berhasil diubah");
        router.refresh();
      } else {
        err("Gagal: " + res.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <Toast msg={toast} />
      <ErrorToast msg={errorToast} />

      {/* Phase Mode */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Mode Monetisasi</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Mengatur apakah pengguna baru wajib berlangganan atau tidak
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PHASE_OPTIONS.map((opt) => {
            const isActive = phase === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handlePhaseMode(opt.value)}
                disabled={isPending}
                className={`text-left p-4 rounded-xl border-2 transition-all disabled:opacity-60 ${
                  isActive
                    ? "border-emerald-500 bg-emerald-900/20"
                    : "border-gray-700 hover:border-gray-500 bg-gray-900/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-semibold text-white text-sm">{opt.label}</span>
                  {isActive && (
                    <span className="ml-auto text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plans */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Daftar Paket Langganan</h2>
            <p className="text-gray-400 text-sm mt-0.5">Klik tombol untuk mengubah harga, fitur, atau status</p>
          </div>
        </div>

        <div className="divide-y divide-gray-700">
          {plans.map((plan) => (
            <div key={plan.id} className="p-6">
              {/* Plan Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{PLAN_ICONS[plan.type] ?? "📦"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base">{plan.name}</span>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded font-mono">
                        {plan.type}
                      </span>
                      {!plan.isActive && (
                        <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 px-2 py-0.5 rounded">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span>
                        Bulanan:{" "}
                        <strong className="text-white">
                          {plan.price === 0 ? "Gratis" : `Rp ${plan.price.toLocaleString("id-ID")}`}
                        </strong>
                      </span>
                      <span>
                        Tahunan:{" "}
                        <strong className="text-white">
                          {plan.yearlyPrice === 0
                            ? "Gratis"
                            : `Rp ${plan.yearlyPrice.toLocaleString("id-ID")}`}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (editingPriceId === plan.id) {
                        setEditingPriceId(null);
                      } else {
                        setEditingPriceId(plan.id);
                        setEditingLimitId(null);
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      editingPriceId === plan.id
                        ? "bg-emerald-700 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    }`}
                  >
                    {editingPriceId === plan.id ? "✕ Harga" : "✏ Harga"}
                  </button>
                  <button
                    onClick={() => {
                      if (editingLimitId === plan.id) {
                        setEditingLimitId(null);
                      } else {
                        setEditingLimitId(plan.id);
                        setEditingPriceId(null);
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      editingLimitId === plan.id
                        ? "bg-emerald-700 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    }`}
                  >
                    {editingLimitId === plan.id ? "✕ Fitur" : "⚙ Fitur"}
                  </button>
                  <button
                    onClick={() => handleToggleActive(plan.id, plan.isActive)}
                    disabled={isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors ${
                      plan.isActive
                        ? "bg-red-900/40 hover:bg-red-900/70 text-red-400 border border-red-800/50"
                        : "bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-400 border border-emerald-800/50"
                    }`}
                  >
                    {plan.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>

              {/* Limits Display (default) */}
              {editingLimitId !== plan.id && editingPriceId !== plan.id && (
                <LimitsDisplay limits={plan.limits} />
              )}

              {/* Price Editor */}
              {editingPriceId === plan.id && (
                <PriceEditor
                  initial={{ price: plan.price, yearlyPrice: plan.yearlyPrice }}
                  onSave={(price, yearly) => handleSavePrice(plan.id, price, yearly)}
                  onCancel={() => setEditingPriceId(null)}
                  isPending={isPending}
                />
              )}

              {/* Limits Editor */}
              {editingLimitId === plan.id && (
                <LimitsEditor
                  initial={plan.limits}
                  planType={plan.type}
                  onSave={(limits) => handleSaveLimits(plan.id, limits)}
                  onCancel={() => setEditingLimitId(null)}
                  isPending={isPending}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
