"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  transferToSavings,
  transferToCharity,
  withdrawFromSavings,
} from "@/actions/ledger";

type Child = {
  id: string;
  name: string;
  avatar: string | null;
  balance: number;
  savingsBalance: number;
  charityBalance: number;
};

type TransferType = "TO_SAVINGS" | "TO_CHARITY" | "FROM_SAVINGS";

interface Props {
  children: Child[];
}

const TRANSFER_OPTIONS: {
  type: TransferType;
  label: string;
  emoji: string;
  desc: string;
  color: string;
}[] = [
  {
    type: "TO_SAVINGS",
    label: "Transfer ke Tabungan",
    emoji: "💰",
    desc: "Saldo utama → Tabungan",
    color: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    type: "TO_CHARITY",
    label: "Transfer ke Sedekah",
    emoji: "🤲",
    desc: "Saldo utama → Sedekah",
    color: "border-purple-200 bg-purple-50 text-purple-700",
  },
  {
    type: "FROM_SAVINGS",
    label: "Tarik dari Tabungan",
    emoji: "🏧",
    desc: "Tabungan → Saldo utama",
    color: "border-orange-200 bg-orange-50 text-orange-700",
  },
];

export default function LedgerClient({ children }: Props) {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = useState<string>(
    children[0]?.id ?? ""
  );
  const [transferType, setTransferType] = useState<TransferType>("TO_SAVINGS");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const child = children.find((c) => c.id === selectedChild);

  // Auto-dismiss success after 5s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;

  const sourceBalanceMap: Record<TransferType, number> = {
    TO_SAVINGS: child?.balance ?? 0,
    TO_CHARITY: child?.balance ?? 0,
    FROM_SAVINGS: child?.savingsBalance ?? 0,
  };

  const sourceLabelMap: Record<TransferType, string> = {
    TO_SAVINGS: "Saldo Utama",
    TO_CHARITY: "Saldo Utama",
    FROM_SAVINGS: "Saldo Tabungan",
  };

  const sourceBalance = sourceBalanceMap[transferType];
  const isOverBalance = parsedAmount > 0 && parsedAmount > sourceBalance;

  // Projected balances after transfer
  const projected = child
    ? (() => {
        if (!parsedAmount || parsedAmount <= 0 || isOverBalance) return null;
        if (transferType === "TO_SAVINGS")
          return {
            balance: child.balance - parsedAmount,
            savings: child.savingsBalance + parsedAmount,
            charity: child.charityBalance,
          };
        if (transferType === "TO_CHARITY")
          return {
            balance: child.balance - parsedAmount,
            savings: child.savingsBalance,
            charity: child.charityBalance + parsedAmount,
          };
        if (transferType === "FROM_SAVINGS")
          return {
            balance: child.balance + parsedAmount,
            savings: child.savingsBalance - parsedAmount,
            charity: child.charityBalance,
          };
        return null;
      })()
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!parsedAmount || parsedAmount <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }
    if (!selectedChild) {
      setError("Pilih anak terlebih dahulu.");
      return;
    }
    if (isOverBalance) {
      setError(`Saldo tidak mencukupi. Maksimal Rp ${sourceBalance.toLocaleString("id-ID")}.`);
      return;
    }

    startTransition(async () => {
      let result;
      if (transferType === "TO_SAVINGS") {
        result = await transferToSavings(selectedChild, parsedAmount);
      } else if (transferType === "TO_CHARITY") {
        result = await transferToCharity(selectedChild, parsedAmount);
      } else {
        result = await withdrawFromSavings(selectedChild, parsedAmount);
      }

      if ("error" in result) {
        if (result.error === "INSUFFICIENT_BALANCE") {
          setError("Saldo tidak mencukupi untuk transfer ini.");
        } else if (result.error === "INVALID_AMOUNT") {
          setError("Jumlah tidak valid. Masukkan angka positif.");
        } else {
          setError("Terjadi kesalahan. Silakan coba lagi.");
        }
        return;
      }

      setSuccess(
        `✅ Transfer berhasil! Saldo: Rp ${result.newBalance.toLocaleString("id-ID")} · Tabungan: Rp ${result.newSavingsBalance.toLocaleString("id-ID")} · Sedekah: Rp ${result.newCharityBalance.toLocaleString("id-ID")}`
      );
      setAmount("");
      router.refresh();
    });
  }

  function formatInput(val: string) {
    const digits = val.replace(/\D/g, "");
    const num = parseInt(digits, 10);
    if (!digits) return "";
    return num.toLocaleString("id-ID");
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Transfer Form */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">Transfer Saldo</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilih Anak */}
            {children.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Pilih Anak
                </label>
                <select
                  value={selectedChild}
                  onChange={(e) => {
                    setSelectedChild(e.target.value);
                    setError(null);
                    setSuccess(null);
                    setAmount("");
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.avatar ?? "🧒"} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Saldo ringkasan */}
            {child && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <BalanceCell
                  label="Saldo"
                  value={child.balance}
                  projected={projected?.balance}
                  colorClass="text-emerald-600"
                  bgClass="bg-gray-50"
                />
                <BalanceCell
                  label="Tabungan"
                  value={child.savingsBalance}
                  projected={projected?.savings}
                  colorClass="text-blue-600"
                  bgClass="bg-blue-50"
                  labelColorClass="text-blue-500"
                />
                <BalanceCell
                  label="Sedekah"
                  value={child.charityBalance}
                  projected={projected?.charity}
                  colorClass="text-purple-600"
                  bgClass="bg-purple-50"
                  labelColorClass="text-purple-500"
                />
              </div>
            )}

            {/* Transfer Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Jenis Transfer
              </label>
              <div className="space-y-2">
                {TRANSFER_OPTIONS.map((opt) => (
                  <label
                    key={opt.type}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      transferType === opt.type
                        ? opt.color + " border-current"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="transferType"
                      value={opt.type}
                      checked={transferType === opt.type}
                      onChange={() => {
                        setTransferType(opt.type);
                        setError(null);
                        setSuccess(null);
                        setAmount("");
                      }}
                      className="sr-only"
                    />
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs opacity-75">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Jumlah (dari {sourceLabelMap[transferType]})
                </label>
                <span className={`text-xs font-semibold ${isOverBalance ? "text-red-500" : "text-gray-500"}`}>
                  Tersedia: Rp {sourceBalance.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setAmount(formatInput(e.target.value));
                    setError(null);
                  }}
                  placeholder="0"
                  className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
                    isOverBalance
                      ? "border-red-300 focus:ring-red-300 bg-red-50"
                      : "border-gray-200 focus:ring-emerald-400"
                  }`}
                />
              </div>
              {isOverBalance && (
                <p className="text-xs text-red-500 mt-1">
                  Jumlah melebihi saldo tersedia (Rp {sourceBalance.toLocaleString("id-ID")})
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {[5000, 10000, 25000, 50000].map((preset) => {
                  const disabled = preset > sourceBalance;
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={disabled}
                      onClick={() => { setAmount(preset.toLocaleString("id-ID")); setError(null); }}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {(preset / 1000).toLocaleString("id-ID")}k
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-xl flex items-center justify-between">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600 font-bold">×</button>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-xl flex items-center justify-between">
                <span>{success}</span>
                <button type="button" onClick={() => setSuccess(null)} className="ml-2 text-emerald-500 hover:text-emerald-700 font-bold">×</button>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !child || !amount || isOverBalance}
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : "Transfer Sekarang"}
            </button>
          </form>
        </div>
      </div>

      {/* Children Overview */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-50">Ringkasan Saldo Anak</h2>
        {children.map((c) => (
          <div
            key={c.id}
            className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-5 cursor-pointer transition-colors duration-200 ${
              selectedChild === c.id
                ? "border-emerald-400 dark:border-emerald-600"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => { setSelectedChild(c.id); setAmount(""); setError(null); setSuccess(null); }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">
                {c.avatar ?? "🧒"}
              </div>
              <p className="font-semibold text-gray-900">{c.name}</p>
              {selectedChild === c.id && (
                <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Dipilih</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-[10px] text-gray-500">Saldo</p>
                <p className="text-xs font-bold text-emerald-600">
                  Rp {c.balance.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-[10px] text-blue-500">Tabungan</p>
                <p className="text-xs font-bold text-blue-600">
                  Rp {c.savingsBalance.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-[10px] text-purple-500">Sedekah</p>
                <p className="text-xs font-bold text-purple-600">
                  Rp {c.charityBalance.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        ))}
        {children.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">Belum ada anak terdaftar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceCell({
  label,
  value,
  projected,
  colorClass,
  bgClass,
  labelColorClass = "text-gray-500",
}: {
  label: string;
  value: number;
  projected?: number;
  colorClass: string;
  bgClass: string;
  labelColorClass?: string;
}) {
  const changed = projected !== undefined && projected !== value;

  return (
    <div className={`${bgClass} rounded-xl p-3 transition-all`}>
      <p className={`text-[10px] ${labelColorClass}`}>{label}</p>
      <p className={`text-xs font-bold ${colorClass}`}>
        Rp {value.toLocaleString("id-ID")}
      </p>
      {changed && projected !== undefined && (
        <p className={`text-[10px] mt-0.5 font-semibold ${projected > value ? "text-emerald-500" : "text-red-400"}`}>
          → {projected.toLocaleString("id-ID")}
        </p>
      )}
    </div>
  );
}
