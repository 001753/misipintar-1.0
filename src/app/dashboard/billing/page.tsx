export const dynamic = 'force-dynamic'
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BillingClient from "./billing-client";

type BillingPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") redirect("/login");

  const familySpaceId = session.user.familySpaceId;
  if (!familySpaceId) redirect("/login");
  const { payment } = await searchParams;
  const paymentReturnState =
    payment === "doku" || payment === "cancelled" ? payment : undefined;

  const [subscription, plans, user] = await Promise.all([
    prisma.subscription.findUnique({
      where: { familySpaceId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    }),
  ]);

  const serializedSubscription = subscription
    ? {
        id: subscription.id,
        status: subscription.status as string,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelReason: subscription.cancelReason,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        plan: {
          id: subscription.plan.id,
          type: subscription.plan.type as string,
          name: subscription.plan.name,
          price: subscription.plan.price,
          yearlyPrice: subscription.plan.yearlyPrice,
          currency: subscription.plan.currency,
          limits: subscription.plan.limits,
        },
        invoices: subscription.invoices.map((inv) => ({
          id: inv.id,
          amount: inv.amount,
          status: inv.status as string,
          paymentProvider: inv.paymentProvider,
          paymentReference: inv.providerInvoiceNumber ?? inv.midtransOrderId,
          paymentMethod: inv.paymentMethod as string | null,
          paidAt: inv.paidAt?.toISOString() ?? null,
          expiredAt: inv.expiredAt.toISOString(),
          createdAt: inv.createdAt.toISOString(),
        })),
      }
    : null;

  const serializedPlans = plans.map((p) => ({
    id: p.id,
    type: p.type as string,
    name: p.name,
    price: p.price,
    yearlyPrice: p.yearlyPrice,
    currency: p.currency,
    limits: p.limits,
  }));

  return (
    <BillingClient
      subscription={serializedSubscription}
      plans={serializedPlans}
      user={{ name: user.name, email: user.email ?? user.phone ?? "" }}
      paymentReturnState={paymentReturnState}
    />
  );
}
