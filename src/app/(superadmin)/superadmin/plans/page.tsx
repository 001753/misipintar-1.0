export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import PlanManagerClient from "./plans-client";

export default async function PlansPage() {
  const [plans, appConfig] = await Promise.all([
    prisma.plan.findMany({ orderBy: { price: "asc" } }),
    prisma.appConfig.findUnique({ where: { id: "global-config" } }),
  ]);

  // Baca showPricingSection dari AppConfig.data (default: true)
  const configData = (appConfig?.data as Record<string, unknown>) ?? {};
  const showPricingSection = configData.showPricingSection !== false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Kelola Plan</h1>
        <p className="text-gray-400 mt-1">Update harga, limit, visibilitas, dan phase mode</p>
      </div>
      <PlanManagerClient
        plans={plans.map((p) => ({
          ...p,
          limits: p.limits as Record<string, unknown>,
        }))}
        currentPhaseMode={appConfig?.phaseMode ?? "FULL_FREE"}
        showPricingSection={showPricingSection}
      />
    </div>
  );
}
