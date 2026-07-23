export const dynamic = 'force-dynamic'
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReceiptView from "./receipt-view";

export const metadata = { title: "Kuitansi Pembayaran — Misi Pintar" };

export default async function InvoiceReceiptPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;

  const session = await auth();
  if (!session || session.user.role !== "PARENT") redirect("/login");

  const familySpaceId = session.user.familySpaceId;
  if (!familySpaceId) redirect("/login");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      subscription: {
        include: {
          plan: true,
          familySpace: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!invoice) notFound();
  if (invoice.subscription.familySpace.id !== familySpaceId) notFound();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  const billingCycle: "MONTHLY" | "YEARLY" =
    invoice.billingCycle === "YEARLY" ||
    (invoice.billingCycle === null &&
      invoice.amount >= invoice.subscription.plan.yearlyPrice &&
      invoice.subscription.plan.yearlyPrice > 0)
      ? "YEARLY"
      : "MONTHLY";

  return (
    <ReceiptView
      invoice={{
        id: invoice.id,
        invoiceNumber:
          invoice.providerInvoiceNumber ??
          invoice.midtransOrderId ??
          `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
        orderId: invoice.providerInvoiceNumber ?? invoice.midtransOrderId ?? "",
        paymentProvider: invoice.paymentProvider,
        issuedAt: invoice.createdAt.toISOString(),
        paidAt: invoice.paidAt?.toISOString() ?? null,
        status: invoice.status as string,
        amount: invoice.amount,
        currency: invoice.subscription.plan.currency,
        paymentMethod: invoice.paymentMethod as string | null,
        billingCycle,
        plan: {
          name: invoice.subscription.plan.name,
          type: invoice.subscription.plan.type as string,
        },
        periodStart: invoice.subscription.currentPeriodStart?.toISOString() ?? null,
        periodEnd: invoice.subscription.currentPeriodEnd?.toISOString() ?? null,
      }}
      customer={{
        name: user.name,
        email: user.email,
        phone: user.phone,
        familySpaceName: invoice.subscription.familySpace.name,
      }}
    />
  );
}
