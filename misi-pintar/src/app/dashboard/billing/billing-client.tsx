"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  createCheckout,
  cancelSubscription,
  resumeSubscription,
  BillingCycle,
} from "@/actions/subscription";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

type Plan = {
  id: string;
  type: string;
  name: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  limits: unknown;
};

type Invoice = {
  id: string;
  amount: number;
  status: string;
  midtransOrderId: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  expiredAt: string;
  createdAt: string;
};

type Subscription = {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  cancelReason: string | null;
  currentPeriodEnd: string;
  plan: Plan;
  invoices: Invoice[];
};

interface Props {
  subscription: Subscription | null;
  plans: Plan[];
  user: { name: string; email: string };
  snapUrl: string;
  clientKey: string;
  isProduction: boolean;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  FREE: { label: "Gratis", color: "bg-gray-100 text-gray-600" },
  TRIAL: { label: "Trial", color: "bg-blue-100 text-blue-600" },
  PRO: { label: "Pro", color: "bg-emerald-100 text-emerald-700" },
  EDUCATOR: { label: "Educator", color: "bg-purple-100 text-purple-700" },
  SCHOOL: { label: "School", color: "bg-orange-100 text-orange-700" },
  EXPIRED: { label: "Expired", color: "bg-red-100 text-red-600" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-600" },
};

const INV_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Menunggu", color: "text-yellow-600" },
  PAID: { label: "Lunas", color: "text-emerald-600" },
  EXPIRED: { label: "Kadaluarsa", color: "text-gray-400" },
  FAILED: { label: "Gagal", color: "text-red-500" },
  REFUNDED: { label: "Refund", color: "text-blue-500" },
};

const PLAN_ICONS: Record<string, string> = {
  STARTER: "🌱",
  PRO: "⚡",
  EDUCATOR: "🎓",
  SCHOOL: "🏫",
};

function fmt(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function BillingClient({
  subscription,
  plans,
  user,
  snapUrl,
  clientKey,
  isProduction,
}: Props) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const snapLoaded = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // PRD §4.5: Polling status subscription maks 10x, interval 3 detik
  // Jangan aktifkan subscription dari Snap.js onSuccess — hanya polling
  function startPolling() {
    let attempts = 0;
    const MAX_ATTEMPTS = 10;
    const INTERVAL_MS = 3000;

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      attempts++;
      router.refresh();

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setToast(
          "Konfirmasi pembayaran sedang diproses. Refresh halaman ini dalam beberapa menit."
        );
      }
    }, INTERVAL_MS);
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const currentStatus = subscription?.status ?? "FREE";
  const currentPlanType = subscription?.plan?.type ?? "STARTER";
  const statusMeta = STATUS_LABELS[currentStatus] ?? STATUS_LABELS.FREE;

  async function handleCheckout(planId: string) {
    setError(null);
    setLoading(planId);
    try {
      const result = await createCheckout(planId, billingCycle);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (!snapLoaded.current || !window.snap) {
        setError("Payment gateway belum siap. Coba refresh halaman.");
        return;
      }
      window.snap.pay(result.snapToken, {
        onSuccess: () => {
          // WAJIB PRD: Jangan aktifkan subscription dari sini.
          // Aktifasi hanya via webhook Midtrans server-to-server.
          // Tampilkan pesan menunggu dan polling status maksimal 10x.
          setToast("Menunggu konfirmasi pembayaran dari server...");
          startPolling();
        },
        onPending: () => {
          setToast("Pembayaran sedang diproses. Kami akan mengonfirmasi segera.");
          startPolling();
        },
        onError: () => {
          setError("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          setToast("Jendela pembayaran ditutup. Jika sudah bayar, tunggu konfirmasi otomatis.");
          router.refresh();
        },
      });
    } finally {
      setLoading(null);
    }
  }

  function handleCancel() {
    if (!confirm("Yakin ingin membatalkan langganan? Masih aktif hingga akhir periode."))
      return;
    startTransition(async () => {
      const r = await cancelSubscription();
      if (r.success) {
        setToast("Langganan dijadwalkan berhenti di akhir periode.");
        router.refresh();
      } else {
        setError(r.error ?? "Gagal membatalkan.");
      }
    });
  }

  function handleResume() {
    startTransition(async () => {
      const r = await resumeSubscription();
      if (r.success) {
        setToast("Pembatalan langganan dibatalkan. Terima kasih!");
        router.refresh();
      } else {
        setError(r.error ?? "Gagal memulihkan.");
      }
    });
  }

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const paidPlans = plans.filter((p) => p.price > 0 || p.yearlyPrice > 0);

  return (
    <>
      <Script
        src={snapUrl}
        data-client-key={clientKey}
        strategy="afterInteractive"
        onLoad={() => {
          snapLoaded.current = true;
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {toast}
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Langganan & Billing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola plan dan riwayat pembayaran keluarga Anda
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Plan Saat Ini
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {PLAN_ICONS[currentPlanType] ?? "🌱"}
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  {subscription?.plan?.name ?? "Starter (Gratis)"}
                </h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${statusMeta.color}`}
                >
                  {statusMeta.label}
                </span>
              </div>
              {periodEnd && currentStatus !== "FREE" && (
                <p className="text-sm text-gray-500 mt-1">
                  {subscription?.cancelAtPeriodEnd
                    ? `⚠️ Berhenti pada ${periodEnd}`
                    : `Aktif hingga ${periodEnd}`}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {subscription?.cancelAtPeriodEnd ? (
                <button
                  onClick={handleResume}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "..." : "Lanjutkan Langganan"}
                </button>
              ) : currentStatus !== "FREE" && currentStatus !== "EXPIRED" ? (
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium border border-red-200 text-red-500 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "..." : "Batalkan"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              billingCycle === "MONTHLY"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setBillingCycle("YEARLY")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              billingCycle === "YEARLY"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tahunan
            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
              Hemat ~17%
            </span>
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paidPlans.map((plan) => {
            const isCurrentPlan = plan.type === currentPlanType && currentStatus !== "FREE" && currentStatus !== "EXPIRED" && currentStatus !== "CANCELLED";
            const price =
              billingCycle === "YEARLY" ? plan.yearlyPrice : plan.price;
            const isLoading = loading === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 p-6 transition-colors ${
                  isCurrentPlan
                    ? "border-emerald-400 shadow-md"
                    : "border-gray-200 hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{PLAN_ICONS[plan.type]}</span>
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  {isCurrentPlan && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">
                      Aktif
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-black text-gray-900">
                    {fmt(price)}
                  </span>
                  <span className="text-sm text-gray-400">
                    /{billingCycle === "YEARLY" ? "tahun" : "bulan"}
                  </span>
                  {billingCycle === "YEARLY" && plan.price > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 line-through">
                      {fmt(plan.price * 12)}/tahun
                    </p>
                  )}
                </div>

                <PlanFeatures planType={plan.type} limits={plan.limits as Record<string, unknown>} />

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isCurrentPlan || isLoading || !!loading}
                  className={`mt-5 w-full py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                    isCurrentPlan
                      ? "bg-emerald-50 text-emerald-600 cursor-default"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  }`}
                >
                  {isLoading
                    ? "Memproses..."
                    : isCurrentPlan
                    ? "Plan Aktif"
                    : `Upgrade ke ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Invoice History */}
        {subscription?.invoices && subscription.invoices.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Riwayat Pembayaran</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {subscription.invoices.map((inv) => {
                const statusMeta =
                  INV_STATUS[inv.status] ?? { label: inv.status, color: "text-gray-500" };
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inv.midtransOrderId ?? `INV-${inv.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {inv.paymentMethod && ` · ${inv.paymentMethod}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {fmt(inv.amount)}
                      </p>
                      <p className={`text-xs font-medium mt-0.5 ${statusMeta.color}`}>
                        {statusMeta.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sandbox Notice */}
        {!isProduction && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            ⚠️ <strong>Mode Sandbox</strong> — Gunakan kartu test Midtrans. Pembayaran tidak nyata.
          </div>
        )}
      </div>
    </>
  );
}

function PlanFeatures({
  planType,
  limits,
}: {
  planType: string;
  limits: Record<string, unknown>;
}) {
  const features: string[] = [];

  const maxChildren = limits?.maxChildren;
  if (maxChildren === -1) features.push("Anak tak terbatas");
  else if (maxChildren) features.push(`${maxChildren} anak`);

  const maxTasks = limits?.maxTasksPerMonth;
  if (maxTasks === -1) features.push("Tugas tak terbatas");
  else if (maxTasks) features.push(`${maxTasks} tugas/bulan`);

  if (limits?.hasInterest) features.push("Bunga tabungan");
  if (limits?.hasTax) features.push("Simulasi pajak");
  if (limits?.maxFamilies) features.push(`${limits.maxFamilies === -1 ? "∞" : limits.maxFamilies} keluarga`);
  if (limits?.sso) features.push("SSO sekolah");

  if (planType === "PRO") features.push("Riwayat lengkap", "Notifikasi push");
  if (planType === "EDUCATOR") features.push("Multi-keluarga", "Laporan kelas");
  if (planType === "SCHOOL") features.push("Dashboard sekolah", "API akses");

  return (
    <ul className="space-y-1.5">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
          <span className="text-emerald-500 font-bold">✓</span>
          {f}
        </li>
      ))}
    </ul>
  );
}
