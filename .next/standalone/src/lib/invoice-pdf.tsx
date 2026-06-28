import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Types ─────────────────────────────────────────────────────
export interface InvoiceReceiptData {
  invoiceNumber: string;
  orderId: string;
  issuedAt: string;
  paidAt: string | null;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  billingCycle: "MONTHLY" | "YEARLY" | null;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
    familySpaceName: string;
  };
  plan: {
    name: string;
    type: string;
  };
  periodStart: string | null;
  periodEnd: string | null;
}

// ── Helpers ───────────────────────────────────────────────────
function fmtIDR(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function payMethodLabel(pm: string | null): string {
  if (!pm) return "—";
  const map: Record<string, string> = {
    QRIS: "QRIS",
    GOPAY: "GoPay",
    SHOPEEPAY: "ShopeePay",
    BANK_TRANSFER: "Transfer Bank",
    CREDIT_CARD: "Kartu Kredit",
    VA: "Virtual Account",
  };
  return map[pm] ?? pm;
}

// ── Styles ────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 48,
    paddingVertical: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a2e",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  brandBlock: { gap: 2 },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#059669" },
  brandTagline: { fontSize: 8, color: "#6b7280", letterSpacing: 0.5 },

  badgeWrap: { alignItems: "flex-end", gap: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
  },
  badgePaid: { backgroundColor: "#d1fae5", color: "#065f46" },
  badgePending: { backgroundColor: "#fef3c7", color: "#92400e" },
  badgeFailed: { backgroundColor: "#fee2e2", color: "#991b1b" },
  invoiceNoText: { fontSize: 8, color: "#9ca3af" },

  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 20 },
  dividerThin: { borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6", marginVertical: 12 },

  // Two-column meta
  metaRow: { flexDirection: "row", gap: 20, marginBottom: 28 },
  metaCol: { flex: 1, gap: 10 },
  metaBlock: { gap: 3 },
  metaLabel: { fontSize: 7.5, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6 },
  metaValue: { fontSize: 10, color: "#111827", fontFamily: "Helvetica-Bold" },
  metaValueNormal: { fontSize: 10, color: "#374151" },

  // Items table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  thText: { fontSize: 8, color: "#6b7280", fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tdText: { fontSize: 10, color: "#374151" },
  tdBold: { fontSize: 10, color: "#111827", fontFamily: "Helvetica-Bold" },

  // Totals
  totalsWrap: { alignItems: "flex-end", marginTop: 12, gap: 4 },
  totalRow: { flexDirection: "row", width: 240, justifyContent: "space-between" },
  totalLabelGray: { fontSize: 9, color: "#6b7280" },
  totalValue: { fontSize: 9, color: "#374151" },
  grandRow: {
    flexDirection: "row",
    width: 240,
    justifyContent: "space-between",
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  grandLabel: { fontSize: 10, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  grandValue: { fontSize: 10, color: "#ffffff", fontFamily: "Helvetica-Bold" },

  // Payment detail
  payBox: {
    marginTop: 24,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  payTitle: { fontSize: 9, color: "#374151", fontFamily: "Helvetica-Bold", marginBottom: 6 },
  payRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  payKey: { fontSize: 8.5, color: "#6b7280", width: 120 },
  payVal: { fontSize: 8.5, color: "#111827" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: { gap: 2 },
  footerText: { fontSize: 7.5, color: "#9ca3af" },
  footerBold: { fontSize: 8, color: "#6b7280", fontFamily: "Helvetica-Bold" },

  // Period banner
  periodBanner: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f0fdf4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  periodText: { fontSize: 9, color: "#065f46" },
  periodBold: { fontSize: 9, color: "#047857", fontFamily: "Helvetica-Bold" },
});

// ── Document ──────────────────────────────────────────────────
export function InvoiceReceiptPDF({ data }: { data: InvoiceReceiptData }) {
  const statusLabel =
    data.status === "PAID" ? "LUNAS" :
    data.status === "PENDING" ? "MENUNGGU" :
    data.status === "EXPIRED" ? "KADALUARSA" :
    data.status === "FAILED" ? "GAGAL" : data.status;

  const badgeStyle =
    data.status === "PAID" ? S.badgePaid :
    data.status === "PENDING" ? S.badgePending : S.badgeFailed;

  const billingCycleLabel =
    data.billingCycle === "YEARLY" ? "Langganan Tahunan" : "Langganan Bulanan";

  const unitPrice = data.amount;

  return (
    <Document
      title={`Kuitansi ${data.invoiceNumber}`}
      author="Misi Pintar"
      subject="Bukti Pembayaran Langganan"
    >
      <Page size="A4" style={S.page}>
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={S.headerRow}>
          <View style={S.brandBlock}>
            <Text style={S.brandName}>Misi Pintar</Text>
            <Text style={S.brandTagline}>PLATFORM LITERASI KEUANGAN KELUARGA</Text>
            <Text style={[S.brandTagline, { marginTop: 6 }]}>
              support@jobenapp.cloud
            </Text>
          </View>
          <View style={S.badgeWrap}>
            <View style={[S.badge, badgeStyle]}>
              <Text>{statusLabel}</Text>
            </View>
            <Text style={S.invoiceNoText}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Meta: From / To / Dates ─────────────────────────── */}
        <View style={S.metaRow}>
          {/* Issued To */}
          <View style={S.metaCol}>
            <View style={S.metaBlock}>
              <Text style={S.metaLabel}>Ditagihkan kepada</Text>
              <Text style={S.metaValue}>{data.customer.name}</Text>
              {data.customer.email && (
                <Text style={S.metaValueNormal}>{data.customer.email}</Text>
              )}
              {data.customer.phone && (
                <Text style={S.metaValueNormal}>{data.customer.phone}</Text>
              )}
              <Text style={[S.metaValueNormal, { color: "#6b7280", fontSize: 9 }]}>
                Ruang Keluarga: {data.customer.familySpaceName}
              </Text>
            </View>
          </View>

          {/* Dates */}
          <View style={S.metaCol}>
            <View style={S.metaBlock}>
              <Text style={S.metaLabel}>Tanggal Invoice</Text>
              <Text style={S.metaValueNormal}>{fmtDate(data.issuedAt)}</Text>
            </View>
            <View style={[S.metaBlock, { marginTop: 10 }]}>
              <Text style={S.metaLabel}>Tanggal Pembayaran</Text>
              <Text style={S.metaValueNormal}>{fmtDate(data.paidAt)}</Text>
            </View>
            <View style={[S.metaBlock, { marginTop: 10 }]}>
              <Text style={S.metaLabel}>Metode Pembayaran</Text>
              <Text style={S.metaValueNormal}>{payMethodLabel(data.paymentMethod)}</Text>
            </View>
          </View>
        </View>

        {/* ── Items Table ─────────────────────────────────────── */}
        <View style={S.tableHeader}>
          <Text style={[S.thText, S.colDesc]}>DESKRIPSI</Text>
          <Text style={[S.thText, S.colQty]}>QTY</Text>
          <Text style={[S.thText, S.colPrice]}>HARGA SATUAN</Text>
          <Text style={[S.thText, S.colTotal]}>SUBTOTAL</Text>
        </View>

        <View style={S.tableRow}>
          <View style={S.colDesc}>
            <Text style={S.tdBold}>
              Misi Pintar {data.plan.name}
            </Text>
            <Text style={[S.tdText, { fontSize: 8.5, color: "#6b7280", marginTop: 2 }]}>
              {billingCycleLabel}
            </Text>
          </View>
          <Text style={[S.tdText, S.colQty, { textAlign: "center" }]}>1</Text>
          <Text style={[S.tdText, S.colPrice, { textAlign: "right" }]}>
            {fmtIDR(unitPrice)}
          </Text>
          <Text style={[S.tdBold, S.colTotal, { textAlign: "right" }]}>
            {fmtIDR(unitPrice)}
          </Text>
        </View>

        {/* ── Totals ──────────────────────────────────────────── */}
        <View style={S.totalsWrap}>
          <View style={S.totalRow}>
            <Text style={S.totalLabelGray}>Subtotal</Text>
            <Text style={S.totalValue}>{fmtIDR(data.amount)}</Text>
          </View>
          <View style={S.totalRow}>
            <Text style={S.totalLabelGray}>PPN (0%)</Text>
            <Text style={S.totalValue}>Rp 0</Text>
          </View>
          <View style={S.grandRow}>
            <Text style={S.grandLabel}>TOTAL DIBAYAR</Text>
            <Text style={S.grandValue}>{fmtIDR(data.amount)}</Text>
          </View>
        </View>

        {/* ── Active Period Banner ─────────────────────────────── */}
        {data.status === "PAID" && data.periodStart && data.periodEnd && (
          <View style={S.periodBanner}>
            <Text style={S.periodText}>✓ Langganan aktif</Text>
            <Text style={S.periodBold}>
              {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)}
            </Text>
          </View>
        )}

        {/* ── Payment Reference ────────────────────────────────── */}
        <View style={S.payBox}>
          <Text style={S.payTitle}>REFERENSI PEMBAYARAN</Text>

          <View style={S.payRow}>
            <Text style={S.payKey}>Nomor Invoice</Text>
            <Text style={S.payVal}>{data.invoiceNumber}</Text>
          </View>

          {data.orderId && (
            <View style={S.payRow}>
              <Text style={S.payKey}>Order ID Midtrans</Text>
              <Text style={S.payVal}>{data.orderId}</Text>
            </View>
          )}

          <View style={S.payRow}>
            <Text style={S.payKey}>Platform Pembayaran</Text>
            <Text style={S.payVal}>Midtrans · PT Midtrans</Text>
          </View>

          <View style={S.payRow}>
            <Text style={S.payKey}>Mata Uang</Text>
            <Text style={S.payVal}>{data.currency}</Text>
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────── */}
        <View style={S.footer} fixed>
          <View style={S.footerLeft}>
            <Text style={S.footerBold}>Misi Pintar</Text>
            <Text style={S.footerText}>
              Dokumen ini adalah bukti pembayaran yang sah secara digital.
            </Text>
            <Text style={S.footerText}>
              Dicetak pada {fmtDate(new Date().toISOString())}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 2 }}>
            <Text style={S.footerText}>support@jobenapp.cloud</Text>
            <Text style={[S.footerText, { color: "#d1d5db" }]}>
              {data.invoiceNumber}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
