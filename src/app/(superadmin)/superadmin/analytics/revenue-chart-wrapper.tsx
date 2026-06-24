"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type RevenueChartClient from "./revenue-chart-client";

const RevenueChartClientDynamic = dynamic(
  () => import("./revenue-chart-client"),
  { ssr: false }
);

export default function RevenueChartWrapper(
  props: ComponentProps<typeof RevenueChartClient>
) {
  return <RevenueChartClientDynamic {...props} />;
}
