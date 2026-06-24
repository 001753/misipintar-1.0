"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { checkQrisStatus } from "@/actions/subscription";

interface QrisModalProps {
  orderId: string;
  qrCodeUrl: string;
  qrString: string;
  amount: number;
  planName: string;
  expiredAt: string;
  onClose: () => void;
  onSuccess: () => void;
}

function fmt(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function useCountdown(expiredAt: string) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiredAt]);

  const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const s = String(secondsLeft % 60).padStart(2, "0");
  return { secondsLeft, display: `${m}:${s}` };
}

export default function QrisModal({
  orderId,
  qrCodeUrl,
  qrString,
  amount,
  planName,
  expiredAt,
  onClose,
  onSuccess,
}: QrisModalProps) {
  const router = useRouter();
  const { secondsLeft, display } = useCountdown(expiredAt);
  const [status, setStatus] = useState<"pending" | "paid" | "expired" | "failed">("pending");
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isExpired = secondsLeft === 0;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isExpired && status === "pending") {
      setStatus("expired");
      stopPolling();
      return;
    }

    if (status !== "pending") { stopPolling(); return; }

    pollRef.current = setInterval(async () => {
      try {
        const result = await checkQrisStatus(orderId);
        if ("error" in result) return;

        if (result.status === "PAID") {
          setStatus("paid");
          stopPolling();
          router.refresh();
          setTimeout(() => onSuccess(), 1500);
        } else if (result.status === "FAILED" || result.status === "EXPIRED") {
          setStatus(result.status === "EXPIRED" ? "expired" : "failed");
          stopPolling();
        }
      } catch {
        // non-fatal polling error — retry next tick
      }
    }, 3000);

    return stopPolling;
  }, [orderId, status, isExpired, stopPolling, router, onSuccess]);

  function handleCopyQrString() {
    if (!qrString) return;
    navigator.clipboard.writeText(qrString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⊡</span>
              <span className="font-bold text-lg">Bayar dengan QRIS</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-lg leading-none"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
          <p className="text-emerald-100 text-sm mt-1">
            {planName} · <strong className="text-white">{fmt(amount)}</strong>
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Status: PAID */}
          {status === "paid" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✅</div>
              <p className="font-bold text-gray-900 text-lg">Pembayaran Berhasil!</p>
              <p className="text-sm text-gray-500 text-center">Langganan Anda sedang diaktifkan…</p>
            </div>
          )}

          {/* Status: EXPIRED */}
          {status === "expired" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">⏰</div>
              <p className="font-bold text-gray-900 text-lg">Waktu Habis</p>
              <p className="text-sm text-gray-500 text-center">QR Code sudah kadaluarsa. Silakan buat transaksi baru.</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Status: FAILED */}
          {status === "failed" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">❌</div>
              <p className="font-bold text-gray-900 text-lg">Pembayaran Gagal</p>
              <p className="text-sm text-gray-500 text-center">Transaksi tidak berhasil. Silakan coba lagi.</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Status: PENDING — show QR */}
          {status === "pending" && (
            <>
              {/* Countdown */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <span className="text-sm text-amber-700 font-medium">⏱ Waktu tersisa</span>
                <span className={`font-mono font-bold text-lg ${secondsLeft < 60 ? "text-red-600" : "text-amber-700"}`}>
                  {display}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-3 shadow-inner">
                  {qrCodeUrl ? (
                    <Image
                      src={qrCodeUrl}
                      alt="QRIS QR Code"
                      width={220}
                      height={220}
                      className="rounded-xl"
                      unoptimized
                    />
                  ) : (
                    <QRCodeFallback qrString={qrString} size={220} />
                  )}
                </div>

                {/* QRIS Brand logos */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {["GoPay", "OVO", "Dana", "ShopeePay", "LinkAja", "BCA", "BRI", "Mandiri"].map((b) => (
                    <span key={b} className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <ol className="text-xs text-gray-500 space-y-1 list-none">
                {[
                  "Buka aplikasi dompet digital atau m-banking Anda",
                  "Pilih menu Scan / QRIS / QR Code",
                  "Scan QR di atas dan konfirmasi pembayaran",
                  "Halaman ini akan otomatis diperbarui",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              {/* Copy QR String */}
              {qrString && (
                <button
                  onClick={handleCopyQrString}
                  className="w-full py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  {copied ? "✓ Tersalin!" : "Salin kode QRIS"}
                </button>
              )}

              {/* Polling indicator */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Menunggu konfirmasi pembayaran...
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <p className="text-center text-[10px] text-gray-300">
            Pembayaran diproses secara aman oleh Midtrans · QRIS resmi Bank Indonesia
          </p>
        </div>
      </div>
    </div>
  );
}

// Fallback: render QR dari qrString menggunakan canvas jika qrCodeUrl tidak tersedia
function QRCodeFallback({ qrString, size }: { qrString: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrString || !canvasRef.current) return;

    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, qrString, {
        width: size,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    }).catch(() => {
      // qrcode package not available — handled gracefully
    });
  }, [qrString, size]);

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {!qrString && (
        <p className="text-xs text-gray-400 text-center">QR Code tidak tersedia</p>
      )}
    </div>
  );
}
