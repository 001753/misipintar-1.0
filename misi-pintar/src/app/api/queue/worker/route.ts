import { NextResponse } from "next/server";
import { interestQueue } from "@/queues";
import { redis } from "@/lib/redis";

let workersStarted = false;

export async function POST() {
  if (!redis) {
    return NextResponse.json(
      { error: "Redis not configured — workers disabled" },
      { status: 503 }
    );
  }

  if (workersStarted) {
    return NextResponse.json({ message: "Workers already running" });
  }

  try {
    const { startInterestWorker } = await import(
      "@/queues/workers/interest.worker"
    );
    startInterestWorker();

    // Register repeatable cron: interest harian jam 00:00
    await interestQueue.add(
      "daily-interest",
      { type: "INTEREST" },
      {
        repeat: { pattern: "0 0 * * *" },
        jobId: "daily-interest",
      }
    );

    // Register repeatable cron: tax bulanan jam 01:00 tgl 1
    await interestQueue.add(
      "monthly-tax",
      { type: "TAX" },
      {
        repeat: { pattern: "0 1 1 * *" },
        jobId: "monthly-tax",
      }
    );

    workersStarted = true;
    console.log("[Workers] Interest & Tax workers started");

    return NextResponse.json({
      message: "Workers started successfully",
      jobs: ["daily-interest (0 0 * * *)", "monthly-tax (0 1 1 * *)"],
    });
  } catch (err) {
    console.error("[Workers] Failed to start:", err);
    return NextResponse.json(
      { error: "Failed to start workers", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!redis) {
    return NextResponse.json({ status: "disabled", reason: "Redis not configured" });
  }
  const repeatable = await interestQueue.getRepeatableJobs();
  return NextResponse.json({ status: "ok", jobs: repeatable });
}
