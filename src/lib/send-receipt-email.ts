/**
 * Orchestrator: generate PDF receipt + send email with attachment.
 *
 * Called from the Midtrans webhook handler after a successful payment.
 * Must be non-fatal — all errors are caught and logged so webhook always returns 200.
 *
 * @react-pdf/renderer di-import secara lazy di dalam fungsi — BUKAN static import
 * di atas — karena ia adalah ESM-only package yang tidak boleh termuat saat build
 * worker mengevaluasi modul ini (mencegah SIGABRT/SIGSEGV).
 */

import { sendMail } from "@/lib/mailer";
import { buildReceiptEmailHtml, buildReceiptEmailText } from "@/lib/email-templates/receipt";

interface SendReceiptEmailParams {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  issuedAt: Date;
  paidAt: Date;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  billingCycle: "MONTHLY" | "YEARLY";
  plan: { name: string; type: string };
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  familySpaceName: string;
  periodStart: Date;
  periodEnd: Date;
}

export async function sendReceiptEmail(params: SendReceiptEmailParams): Promise<void> {
  if (!params.customer.email) {
    console.warn(`[ReceiptEmail] No email for invoice ${params.invoiceNumber} — skipped`);
    return;
  }

  const appUrl =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://mp.jobenapp.cloud";

  const receiptUrl = `${appUrl}/dashboard/billing/invoice/${params.invoiceId}`;

  // ── 1. Generate PDF buffer (lazy import — ESM-only, must not load at module level) ──
  const [React, { renderToBuffer }, { InvoiceReceiptPDF }] = await Promise.all([
    import("react"),
    import("@react-pdf/renderer"),
    import("@/lib/invoice-pdf"),
  ])

  const pdfData = {
    invoiceNumber: params.invoiceNumber,
    orderId: params.orderId,
    issuedAt: params.issuedAt.toISOString(),
    paidAt: params.paidAt.toISOString(),
    status: "PAID",
    amount: params.amount,
    currency: params.currency,
    paymentMethod: params.paymentMethod,
    billingCycle: params.billingCycle,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      phone: params.customer.phone,
      familySpaceName: params.familySpaceName,
    },
    plan: params.plan,
    periodStart: params.periodStart.toISOString(),
    periodEnd: params.periodEnd.toISOString(),
  };

  const pdfElement = React.default.createElement(InvoiceReceiptPDF, { data: pdfData })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(pdfElement as any);

  const pdfFilename = `Kuitansi-${params.invoiceNumber}.pdf`;

  // ── 2. Build email content ─────────────────────────────────
  const emailData = {
    customerName: params.customer.name,
    customerEmail: params.customer.email,
    familySpaceName: params.familySpaceName,
    invoiceNumber: params.invoiceNumber,
    orderId: params.orderId,
    planName: params.plan.name,
    billingCycle: params.billingCycle,
    amount: params.amount,
    currency: params.currency,
    paymentMethod: params.paymentMethod,
    paidAt: params.paidAt.toISOString(),
    periodStart: params.periodStart.toISOString(),
    periodEnd: params.periodEnd.toISOString(),
    receiptUrl,
  };

  const html = buildReceiptEmailHtml(emailData);
  const text = buildReceiptEmailText(emailData);

  // ── 3. Send email with PDF attachment ─────────────────────
  await sendMail({
    to: params.customer.email,
    subject: `✅ Kuitansi Pembayaran ${params.invoiceNumber} — Misi Pintar`,
    html,
    text,
    attachments: [
      {
        filename: pdfFilename,
        content: Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      },
    ],
  });

  console.info(`[ReceiptEmail] Sent to ${params.customer.email} — ${params.invoiceNumber}`);
}
