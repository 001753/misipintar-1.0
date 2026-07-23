/**
 * HTML email template for payment receipt.
 * Uses inline CSS only — email clients strip <style> blocks.
 * Tested layout: mobile-friendly single-column, max-width 600px.
 */

interface ReceiptEmailData {
  customerName: string;
  customerEmail: string;
  familySpaceName: string;
  invoiceNumber: string;
  orderId: string;
  paymentProvider: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY";
  amount: number;
  currency: string;
  paymentMethod: string | null;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  receiptUrl: string;
}

function fmtIDR(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PAY_METHOD_LABELS: Record<string, string> = {
  QRIS: "QRIS",
  GOPAY: "GoPay",
  SHOPEEPAY: "ShopeePay",
  BANK_TRANSFER: "Transfer Bank",
  CREDIT_CARD: "Kartu Kredit",
  VA: "Virtual Account",
  MANDIRI_VA: "Mandiri Virtual Account",
  EWALLET: "E-wallet",
};

export function buildReceiptEmailHtml(data: ReceiptEmailData): string {
  const billingLabel = data.billingCycle === "YEARLY" ? "Tahunan" : "Bulanan";
  const payLabel = data.paymentMethod
    ? PAY_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod
    : "—";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kuitansi Pembayaran — Misi Pintar</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#0d9488 100%);border-radius:16px 16px 0 0;padding:36px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;color:#a7f3d0;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Misi Pintar</p>
                    <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;">Pembayaran Berhasil ✅</h1>
                    <p style="margin:8px 0 0;color:#d1fae5;font-size:14px;">Terima kasih, <strong>${escapeHtml(data.customerName)}</strong>. Langganan Anda telah aktif.</p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background:rgba(255,255,255,0.2);border-radius:10px;padding:8px 14px;display:inline-block;">
                      <p style="margin:0;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;">LUNAS</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#ffffff;padding:32px 40px;">

              <!-- Active period banner -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 2px;color:#065f46;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✓ Langganan Aktif</p>
                    <p style="margin:0;color:#047857;font-size:14px;font-weight:600;">${fmtDate(data.periodStart)} — ${fmtDate(data.periodEnd)}</p>
                  </td>
                </tr>
              </table>

              <!-- Meta grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Penerima</p>
                    <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">${escapeHtml(data.customerName)}</p>
                    <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">${escapeHtml(data.customerEmail)}</p>
                  </td>
                  <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Ruang Keluarga</p>
                    <p style="margin:0;color:#374151;font-size:14px;">${escapeHtml(data.familySpaceName)}</p>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Tanggal Bayar</p>
                    <p style="margin:0;color:#374151;font-size:14px;">${fmtDate(data.paidAt)}</p>
                  </td>
                  <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                    <p style="margin:0 0 3px;color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Metode Pembayaran</p>
                    <p style="margin:0;color:#374151;font-size:14px;font-weight:600;">${escapeHtml(payLabel)}</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />

              <!-- Item table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 12px;border-radius:8px 0 0 0;">
                    <p style="margin:0;color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Deskripsi</p>
                  </td>
                  <td align="right" style="padding:10px 12px;border-radius:0 8px 0 0;">
                    <p style="margin:0;color:#6b7280;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Jumlah</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 12px;border-bottom:1px solid #f3f4f6;">
                    <p style="margin:0;color:#111827;font-size:14px;font-weight:600;">Misi Pintar ${escapeHtml(data.planName)}</p>
                    <p style="margin:3px 0 0;color:#6b7280;font-size:12px;">Langganan ${billingLabel}</p>
                  </td>
                  <td align="right" style="padding:16px 12px;border-bottom:1px solid #f3f4f6;">
                    <p style="margin:0;color:#374151;font-size:14px;">${fmtIDR(data.amount)}</p>
                  </td>
                </tr>
                <tr style="background:#f9fafb;">
                  <td style="padding:10px 12px;">
                    <p style="margin:0;color:#6b7280;font-size:12px;">PPN (0%)</p>
                  </td>
                  <td align="right" style="padding:10px 12px;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">Rp 0</p>
                  </td>
                </tr>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#059669;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;color:#d1fae5;font-size:12px;font-weight:600;letter-spacing:0.5px;">TOTAL DIBAYAR</p>
                  </td>
                  <td align="right" style="padding:14px 16px;">
                    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;">${fmtIDR(data.amount)}</p>
                  </td>
                </tr>
              </table>

              <!-- Reference box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 12px;color:#374151;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Referensi Pembayaran</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Nomor Invoice</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;font-family:monospace;">${escapeHtml(data.invoiceNumber)}</p>
                        </td>
                      </tr>
                      ${data.orderId ? `
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Referensi Provider</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;font-family:monospace;">${escapeHtml(data.orderId)}</p>
                        </td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Platform</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;">${data.paymentProvider === "DOKU" ? "DOKU Checkout" : "Midtrans"}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;">
                          <p style="margin:0;color:#6b7280;font-size:12px;">Mata Uang</p>
                        </td>
                        <td align="right" style="padding:3px 0;">
                          <p style="margin:0;color:#111827;font-size:12px;">${escapeHtml(data.currency)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td align="center">
                    <a href="${data.receiptUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.3px;">
                      ↓ Lihat &amp; Unduh Kuitansi PDF
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;text-align:center;color:#9ca3af;font-size:11px;">Kuitansi PDF juga terlampir di email ini.</p>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;color:#374151;font-size:13px;font-weight:700;">Misi Pintar</p>
                    <p style="margin:0;color:#9ca3af;font-size:11px;">Platform Literasi Keuangan Keluarga</p>
                    <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;">
                      Pertanyaan? Hubungi kami di
                      <a href="mailto:${process.env.SMTP_USER ?? "support@jobenapp.cloud"}" style="color:#059669;text-decoration:none;">support@jobenapp.cloud</a>
                    </p>
                  </td>
                  <td align="right" valign="middle">
                    <p style="margin:0;color:#d1d5db;font-size:10px;font-family:monospace;">${escapeHtml(data.invoiceNumber)}</p>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
              <p style="margin:0;color:#d1d5db;font-size:10px;text-align:center;">
                Email ini dikirim secara otomatis. Mohon tidak membalas email ini langsung.<br/>
                Dokumen ini merupakan bukti pembayaran yang sah secara digital.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildReceiptEmailText(data: ReceiptEmailData): string {
  const billingLabel = data.billingCycle === "YEARLY" ? "Tahunan" : "Bulanan";
  const payLabel = data.paymentMethod
    ? PAY_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod
    : "—";

  return `
PEMBAYARAN BERHASIL — Misi Pintar
===================================

Halo ${data.customerName},

Pembayaran Anda telah berhasil dikonfirmasi. Berikut rincian kuitansi Anda.

LANGGANAN AKTIF
---------------
Periode: ${fmtDate(data.periodStart)} — ${fmtDate(data.periodEnd)}

DETAIL PEMBAYARAN
-----------------
Nama         : ${data.customerName}
Email        : ${data.customerEmail}
Ruang Keluarga: ${data.familySpaceName}
Tanggal Bayar: ${fmtDate(data.paidAt)}
Metode       : ${payLabel}

RINCIAN PESANAN
---------------
Misi Pintar ${data.planName} — Langganan ${billingLabel}
Subtotal     : ${fmtIDR(data.amount)}
PPN          : Rp 0
TOTAL DIBAYAR: ${fmtIDR(data.amount)}

REFERENSI
---------
Nomor Invoice: ${data.invoiceNumber}
${data.orderId ? `Referensi    : ${data.orderId}\n` : ""}Platform     : ${data.paymentProvider === "DOKU" ? "DOKU Checkout" : "Midtrans"}
Mata Uang    : ${data.currency}

Unduh kuitansi PDF Anda di:
${data.receiptUrl}

Kuitansi PDF juga terlampir di email ini.

--
Misi Pintar — Platform Literasi Keuangan Keluarga
Pertanyaan? Hubungi support@jobenapp.cloud
`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
