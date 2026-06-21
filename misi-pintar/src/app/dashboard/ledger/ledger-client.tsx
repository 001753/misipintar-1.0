"use client";

import { useState, useTransition } from "react";
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = parseInt(amount.replace(/\D/g, ""), 10);
    if (!parsed || parsed <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }
    if (!selectedChild) {
      setError("Pilih anak terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      let result;
      if (transferType === "TO_SAVINGS") {
        result = await transferToSavings(selectedChild, parsed);
      } else if (transferType === "TO_CHARITY") {
        result = await transferToCharity(selectedChild, parsed);
      } else {
        result = await withdrawFromSavings(selectedChild, parsed);
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
        `Berhasil! Saldo baru: Rp ${result.newBalance.toLocaleString("id-ID")} · Tabungan: Rp ${result.newSavingsBalance.toLocaleString("id-ID")} · Sedekah: Rp ${result.newCharityBalance.toLocaleString("id-ID")}`
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

  const sourceLabelMap: Record<TransferType, string> = {
    TO_SAVINGS: "Saldo Utama",
    TO_CHARITY: "Saldo Utama",
    FROM_SAVINGS: "Saldo Tabungan",
  };

  const sourceBalanceMap: Record<TransferType, number> = {
    TO_SAVINGS: child?.balance ?? 0,
    TO_CHARITY: child?.balance ?? 0,
    FROM_SAVINGS: child?.savingsBalance ?? 0,
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Transfer Form */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Transfer Saldo</h2>

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
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Saldo</p>
                  <p className="text-xs font-bold text-emerald-600">
                    Rp {child.balance.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[10px] text-blue-500">Tabungan</p>
                  <p className="text-xs font-bold text-blue-600">
                    Rp {child.savingsBalance.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-[10px] text-purple-500">Sedekah</p>
                  <p className="text-xs font-bold text-purple-600">
                    Rp {child.charityBalance.toLocaleString("id-ID")}
                  </p>
                </div>
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Jumlah (dari {sourceLabelMap[transferType]}:{" "}
                <span className="font-bold text-gray-800">
                  Rp {sourceBalanceMap[transferType].toLocaleString("id-ID")}
                </span>
                )
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(formatInput(e.target.value))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[5000, 10000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toLocaleString("id-ID"))}
                    className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                  >
                    {(preset / 1000).toLocaleString("id-ID")}k
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-xl">
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !child || !amount}
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Memproses..." : "Transfer Sekarang"}
            </button>
          </form>
        </div>
      </div>

      {/* Children Overview */}
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-900">Ringkasan Saldo Anak</h2>
        {children.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-colors ${
              selectedChild === c.id
                ? "border-emerald-400"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedChild(c.id)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">
                {c.avatar ?? "🧒"}
              </div>
              <p className="font-semibold text-gray-900">{c.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-[10px] text-gray-500">Saldo</p>
                <p className="text-xs font-bold text-emerald-600">
                  {c.balance.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-[10px] text-blue-500">Tabungan</p>
                <p className="text-xs font-bold text-blue-600">
                  {c.savingsBalance.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-[10px] text-purple-500">Sedekah</p>
                <p className="text-xs font-bold text-purple-600">
                  {c.charityBalance.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
