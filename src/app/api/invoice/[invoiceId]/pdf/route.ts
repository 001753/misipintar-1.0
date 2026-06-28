// @react-pdf/renderer dan @/lib/invoice-pdf di-import secara lazy (dynamic import
// di dalam handler) — BUKAN static import di atas — karena keduanya adalah
// ESM-only / heavy modules yang tidak boleh termuat saat build worker
// mengevaluasi modul ini (mencegah SIGABRT/SIGSEGV).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

// GET /api/invoice/[invoiceId]/pdf
// Auth-gated: only the invoice owner (parent of the family space) may download
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  const session = await auth();
  if (!session || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const familySpaceId = session.user.familySpaceId;
  if (!familySpaceId) {
    return NextResponse.json({ error: "No family space" }, { status: 403 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      subscription: {
        include: {
          plan: true,
          familySpace: {
            select: { id: true, name: true, ownerId: true },
          },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
  }

  if (invoice.subscription.familySpace.id !== familySpaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  const billingCycle: "MONTHLY" | "YEARLY" | null =
    invoice.midtransOrderId?.includes("-YEARLY") ? "YEARLY" :
    invoice.midtransOrderId?.includes("-MONTHLY") ? "MONTHLY" :
    invoice.amount >= invoice.subscription.plan.yearlyPrice &&
    invoice.subscription.plan.yearlyPrice > 0
      ? "YEARLY"
      : "MONTHLY";

  try {
    // Lazy import — mencegah ESM-only @react-pdf/renderer termuat saat build
    const [React, { renderToBuffer }, { InvoiceReceiptPDF }] = await Promise.all([
      import("react"),
      import("@react-pdf/renderer"),
      import("@/lib/invoice-pdf"),
    ])

    const data = {
      invoiceNumber: invoice.midtransOrderId ?? `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
      orderId: invoice.midtransOrderId ?? "",
      issuedAt: invoice.createdAt.toISOString(),
      paidAt: invoice.paidAt?.toISOString() ?? null,
      status: invoice.status as string,
      amount: invoice.amount,
      currency: invoice.subscription.plan.currency,
      paymentMethod: invoice.paymentMethod as string | null,
      billingCycle,
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        familySpaceName: invoice.subscription.familySpace.name,
      },
      plan: {
        name: invoice.subscription.plan.name,
        type: invoice.subscription.plan.type as string,
      },
      periodStart: invoice.subscription.currentPeriodStart?.toISOString() ?? null,
      periodEnd: invoice.subscription.currentPeriodEnd?.toISOString() ?? null,
    };

    const element = React.default.createElement(InvoiceReceiptPDF, { data })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    const filename = `Kuitansi-${data.invoiceNumber}.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[PDF] Render error:", err);
    return NextResponse.json(
      { error: "Gagal membuat PDF. Coba lagi." },
      { status: 500 }
    );
  }
}
