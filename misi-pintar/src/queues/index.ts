import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const notificationQueue = new Queue("notifications", { connection });
export const reportQueue = new Queue("reports", { connection });
export const subscriptionQueue = new Queue("subscriptions", { connection });
export const interestQueue = new Queue("interest", { connection });
