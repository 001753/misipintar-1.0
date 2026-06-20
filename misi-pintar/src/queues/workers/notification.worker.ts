import { Worker, Job } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    const { type, payload } = job.data;
    // TODO: Phase 5 — FCM + SSE implementation
    console.log(`[NotificationWorker] Processing job ${job.id} type=${type}`);
  },
  { connection }
);
