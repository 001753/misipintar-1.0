module.exports = [
"[project]/src/lib/prisma.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// @prisma/client di-require() secara lazy di dalam fungsi — BUKAN static import di atas.
//
// Root cause SIGSEGV di cPanel (berlapis):
//   1. Static `import { PrismaClient } from '@prisma/client'` memuat kode inisialisasi
//      Prisma (termasuk registrasi signal handler untuk binary engine) pada saat
//      modul pertama kali di-import oleh build worker.
//   2. Ketika build worker exit setelah "Collecting page data", signal handler tersebut
//      meng-akses state yang sudah di-free → SIGSEGV.
//
// Fix: require() hanya dipanggil saat query pertama dieksekusi di server runtime.
// Saat build, Proxy mengembalikan fungsi no-op sehingga @prisma/client tidak pernah dimuat.
__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
const globalForPrisma = globalThis;
function createPrismaClient() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = __turbopack_context__.r("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
    return new PrismaClient({
        log: ("TURBOPACK compile-time truthy", 1) ? [
            'error',
            'warn'
        ] : "TURBOPACK unreachable"
    });
}
let _instance;
const prisma = new Proxy({}, {
    get (_, prop) {
        if (!_instance) {
            _instance = globalForPrisma.prisma ?? createPrismaClient();
            globalForPrisma.prisma = _instance;
        }
        return Reflect.get(_instance, prop, _instance);
    }
});
}),
"[project]/src/lib/redis.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "redis",
    ()=>redis
]);
const globalForRedis = globalThis;
function createRedisClient() {
    // Jangan load ioredis saat build phase
    if (process.env.NEXT_BUILD === '1') return undefined;
    const url = process.env.REDIS_URL;
    if (!url) {
        console.warn('[redis] REDIS_URL not set — rate limiting disabled');
        return undefined;
    }
    // require() lazy — ioredis (dan @msgpackr-extract native binary-nya) HANYA
    // dimuat saat REDIS_URL tersedia dan client pertama kali dibutuhkan.
    // Static `import Redis from 'ioredis'` di baris pertama menyebabkan build
    // worker Next.js memuat native binary ini bahkan saat Redis tidak dipakai,
    // yang memicu crash di environment dengan ulimit ketat (cPanel shared hosting).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IRedis = __turbopack_context__.r("[externals]/ioredis [external] (ioredis, cjs, [project]/node_modules/ioredis)").default;
    const options = {
        maxRetriesPerRequest: 3,
        retryStrategy: (times)=>Math.min(times * 50, 2000),
        lazyConnect: true
    };
    return new IRedis(url, options);
}
const redis = globalForRedis.redis ?? createRedisClient();
if ("TURBOPACK compile-time truthy", 1) globalForRedis.redis = redis;
}),
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
"[project]/src/queues/workers/subscription.worker.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runExpireSubscriptions",
    ()=>runExpireSubscriptions,
    "startSubscriptionWorker",
    ()=>startSubscriptionWorker
]);
/**
 * [4.6] Subscription Expiry Worker — PRD v4.1
 *
 * Cron setiap jam: cari Subscription dengan currentPeriodEnd < now()
 * dan status bukan EXPIRED/CANCELLED → update ke EXPIRED
 * Gunakan Redis distributed lock: "cron:mutex:expire-subs"
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$bullmq__$5b$external$5d$__$28$bullmq$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$bullmq$29$__ = __turbopack_context__.i("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)");
;
;
;
;
const LOCK_KEY = "cron:mutex:expire-subs";
const LOCK_TTL_SECONDS = 300; // 5 menit
const BATCH_SIZE = 200;
async function acquireLock() {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return false;
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].set(LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
    return result === "OK";
}
async function releaseLock() {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].del(LOCK_KEY);
}
async function runExpireSubscriptions() {
    const locked = await acquireLock();
    if (!locked) {
        console.log("[SubExpiry] Skipped — lock held by another instance");
        return {
            checked: 0,
            expired: 0,
            errors: 0
        };
    }
    let cursor = 0;
    let checked = 0;
    let expired = 0;
    let errors = 0;
    const now = new Date();
    try {
        while(true){
            // Cari subscription yang melewati currentPeriodEnd tapi belum EXPIRED/CANCELLED
            const subscriptions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].subscription.findMany({
                where: {
                    currentPeriodEnd: {
                        lt: now
                    },
                    status: {
                        notIn: [
                            "EXPIRED",
                            "CANCELLED",
                            "FREE"
                        ]
                    }
                },
                include: {
                    familySpace: {
                        select: {
                            id: true,
                            name: true,
                            ownerId: true
                        }
                    },
                    plan: {
                        select: {
                            name: true
                        }
                    }
                },
                skip: cursor,
                take: BATCH_SIZE,
                orderBy: {
                    currentPeriodEnd: "asc"
                }
            });
            if (subscriptions.length === 0) break;
            for (const sub of subscriptions){
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
                        // Update status ke EXPIRED
                        await tx.subscription.update({
                            where: {
                                id: sub.id
                            },
                            data: {
                                status: "EXPIRED"
                            }
                        });
                        // Kirim notifikasi in-app ke parent
                        await tx.notification.create({
                            data: {
                                familySpaceId: sub.familySpace.id,
                                userId: sub.familySpace.ownerId,
                                title: "Langganan Berakhir",
                                body: `Langganan ${sub.plan.name} keluarga ${sub.familySpace.name} telah berakhir. Perpanjang sekarang untuk tetap menikmati fitur premium.`,
                                type: "subscription_expired"
                            }
                        });
                    });
                    expired++;
                    console.log(`[SubExpiry] Expired: sub=${sub.id} family=${sub.familySpace.name} plan=${sub.plan.name} end=${sub.currentPeriodEnd.toISOString()}`);
                } catch (err) {
                    errors++;
                    console.error(`[SubExpiry] Failed to expire sub=${sub.id}:`, err);
                }
                checked++;
            }
            cursor += BATCH_SIZE;
            if (subscriptions.length < BATCH_SIZE) break;
        }
        // Juga handle cancelAtPeriodEnd yang sudah lewat — ubah ke CANCELLED
        const cancelledCount = await expireCancelledSubscriptions(now);
        console.log(`[SubExpiry] Done — checked=${checked}, expired=${expired}, cancelled=${cancelledCount}, errors=${errors}`);
    } finally{
        await releaseLock();
    }
    return {
        checked,
        expired,
        errors
    };
}
/**
 * Handle cancelAtPeriodEnd: jika sudah lewat periodEnd, ubah ke CANCELLED
 */ async function expireCancelledSubscriptions(now) {
    const toCancel = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].subscription.findMany({
        where: {
            cancelAtPeriodEnd: true,
            currentPeriodEnd: {
                lt: now
            },
            status: {
                notIn: [
                    "CANCELLED",
                    "EXPIRED",
                    "FREE"
                ]
            }
        },
        include: {
            familySpace: {
                select: {
                    id: true,
                    name: true,
                    ownerId: true
                }
            },
            plan: {
                select: {
                    name: true
                }
            }
        },
        take: BATCH_SIZE
    });
    let cancelled = 0;
    for (const sub of toCancel){
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
                await tx.subscription.update({
                    where: {
                        id: sub.id
                    },
                    data: {
                        status: "CANCELLED",
                        cancelAtPeriodEnd: false
                    }
                });
                await tx.notification.create({
                    data: {
                        familySpaceId: sub.familySpace.id,
                        userId: sub.familySpace.ownerId,
                        title: "Langganan Dibatalkan",
                        body: `Langganan ${sub.plan.name} keluarga ${sub.familySpace.name} telah dibatalkan sesuai permintaan.`,
                        type: "subscription_cancelled"
                    }
                });
            });
            cancelled++;
        } catch (err) {
            console.error(`[SubExpiry] Failed to cancel sub=${sub.id}:`, err);
        }
    }
    return cancelled;
}
function startSubscriptionWorker() {
    const connection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getBullConnection"])();
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"] || !connection) {
        console.warn("[SubExpiry] Redis not available — subscription expiry cron disabled");
        return null;
    }
    const worker = new __TURBOPACK__imported__module__$5b$externals$5d2f$bullmq__$5b$external$5d$__$28$bullmq$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$bullmq$29$__["Worker"]("subscriptions", async (job)=>{
        console.log(`[SubExpiry] Job ${job.id} started`);
        return runExpireSubscriptions();
    }, {
        connection
    });
    worker.on("failed", (job, err)=>{
        console.error(`[SubExpiry] Job ${job?.id} failed:`, err);
    });
    return worker;
}
}),
"[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("bullmq-4bb1c7ed12dfb5e0", () => require("bullmq-4bb1c7ed12dfb5e0"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client-2c3a283f134fdcb6", () => require("@prisma/client-2c3a283f134fdcb6"));

module.exports = mod;
}),
"[externals]/ioredis [external] (ioredis, cjs, [project]/node_modules/ioredis)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("ioredis-23a6225d3f8c0bff", () => require("ioredis-23a6225d3f8c0bff"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0w68jlh._.js.map