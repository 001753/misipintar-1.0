"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  transferToSavings,
  transferToCharity,
  withdrawFromSavings,
} from "@/actions/ledger";

type TransferType = "TO_SAVINGS" | "TO_CHARITY" | "FROM_SAVINGS";

interface Child {
  id: string;
  name: string;
  avatar: string | null;
  balance: number;
  savingsBalance: number;
  charityBalance: number;
}

const OPTIONS: { type: TransferType; emoji: string; label: string; desc: string }[] = [
  { type: "TO_SAVINGS", emoji: "💰", label: "Ke Tabungan", desc: "Simpan dari saldo utama" },
  { type: "TO_CHARITY", emoji: "🤲", label: "Ke Sedekah", desc: "Berbagi dari saldo utama" },
  { type: "FROM_SAVINGS", emoji: "🏧", label: "Tarik Tabungan", desc: "Kembali ke saldo utama" },
];

const SOURCE_BALANCE_KEY: Record<TransferType, keyof Child> = {
  TO_SAVINGS: "balance",
  TO_CHARITY: "balance",
  FROM_SAVINGS: "savingsBalance",
};

export default function ChildTransferClient({ child }: { child: Child }) {
  const router = useRouter();
  const [tab, setTab] = useState<TransferType>("TO_SAVINGS");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function formatInput(val: string) {
    const digits = val.replace(/\D/g, "");
    const num = parseInt(digits, 10);
    return digits ? num.toLocaleString("id-ID") : "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = parseInt(amount.replace(/\D/g, ""), 10);
    if (!parsed || parsed <= 0) {
      setError("Masukkan jumlah yang valid.");
      return;
    }

    startTransition(async () => {
      let result;
      if (tab === "TO_SAVINGS") result = await transferToSavings(child.id, parsed);
      else if (tab === "TO_CHARITY") result = await transferToCharity(child.id, parsed);
      else result = await withdrawFromSavings(child.id, parsed);

      if ("error" in result) {
        if (result.error === "INSUFFICIENT_BALANCE") {
          setError("Saldo tidak cukup untuk transfer ini.");
        } else if (result.error === "INVALID_AMOUNT") {
          setError("Jumlah tidak valid.");
        } else {
          setError("Terjadi kesalahan, coba lagi.");
        }
        return;
      }

      setSuccess("✅ Berhasil!");
      setAmount("");
      router.refresh();
    });
  }

  const sourceBalance = child[SOURCE_BALANCE_KEY[tab]] as number;
  const selectedOpt = OPTIONS.find((o) => o.type === tab)!;

  return (
    <div className="space-y-4 pt-2">
      {/* Greeting */}
      <div className="text-white text-center py-2">
        <div className="text-4xl mb-1">{child.avatar ?? "🧒"}</div>
        <h1 className="text-lg font-bold">{child.name}</h1>
      </div>

      {/* Saldo Card */}
      <div className="bg-white rounded-2xl p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[10px] text-gray-500">Saldo</p>
            <p className="text-sm font-black text-emerald-600">
              Rp {child.balance.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5">
            <p className="text-[10px] text-blue-500">Tabungan</p>
            <p className="text-sm font-black text-blue-600">
              Rp {child.savingsBalance.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-2.5">
            <p className="text-[10px] text-purple-500">Sedekah</p>
            <p className="text-sm font-black text-purple-600">
              Rp {child.charityBalance.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => {
              setTab(opt.type);
              setError(null);
              setSuccess(null);
              setAmount("");
            }}
            className={`py-3 px-2 rounded-2xl text-center transition-colors ${
              tab === opt.type
                ? "bg-white shadow-md"
                : "bg-white/40 hover:bg-white/60"
            }`}
          >
            <div className="text-2xl">{opt.emoji}</div>
            <p className="text-xs font-semibold text-gray-800 mt-1">{opt.label}</p>
          </button>
        ))}
      </div>

      {/* Transfer Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {selectedOpt.emoji} {selectedOpt.label}
          </p>
          <p className="text-xs text-gray-500">{selectedOpt.desc}</p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">
            Sumber tersedia:{" "}
            <span className="font-bold text-gray-800">
              Rp {sourceBalance.toLocaleString("id-ID")}
            </span>
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
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {[1000, 2000, 5000, 10000].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p.toLocaleString("id-ID"))}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-emerald-100 rounded-lg transition-colors text-gray-600"
              >
                Rp {(p / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 rounded-xl">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !amount}
          className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Memproses..." : `${selectedOpt.emoji} ${selectedOpt.label}`}
        </button>
      </form>
    </div>
  );
}
