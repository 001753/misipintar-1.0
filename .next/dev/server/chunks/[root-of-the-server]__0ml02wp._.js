module.exports = [
"[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Shared BullMQ connection helper.
 * Parses REDIS_URL (ioredis format) into BullMQ connection config object.
 * Returns null if REDIS_URL is not set — callers must handle gracefully.
 */ __turbopack_context__.s([
    "getBullConnection",
    ()=>getBullConnection
]);
function getBullConnection() {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            password: parsed.password || undefined,
            username: parsed.username || undefined,
            tls: parsed.protocol === 'rediss:' ? {} : undefined
        };
    } catch  {
        return null;
    }
}
}),
"[project]/src/queues/index.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "interestQueue",
    ()=>interestQueue,
    "notificationQueue",
    ()=>notificationQueue,
    "reportQueue",
    ()=>reportQueue,
    "subscriptionQueue",
    ()=>subscriptionQueue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)");
;
function makeQueue(name) {
    const connection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getBullConnection"])();
    if (!connection) return null;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Queue } = __turbopack_context__.r("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
        return new Queue(name, {
            connection
        });
    } catch  {
        return null;
    }
}
const notificationQueue = makeQueue('notifications');
const reportQueue = makeQueue('reports');
const subscriptionQueue = makeQueue('subscriptions');
const interestQueue = makeQueue('interest');
}),
"[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("bullmq-4bb1c7ed12dfb5e0", () => require("bullmq-4bb1c7ed12dfb5e0"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ml02wp._.js.map