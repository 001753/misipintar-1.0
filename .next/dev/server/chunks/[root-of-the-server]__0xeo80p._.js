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
"[project]/src/lib/db-lock.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "acquireDbLock",
    ()=>acquireDbLock,
    "cleanExpiredLocks",
    ()=>cleanExpiredLocks,
    "releaseDbLock",
    ()=>releaseDbLock
]);
/**
 * DB-based distributed lock menggunakan PostgreSQL.
 * Pengganti Redis SET NX EX untuk cron job di cPanel shared hosting.
 *
 * Cara kerja:
 * - acquire: INSERT INTO CronLock (upsert) dengan expiresAt = now + ttl
 *   Jika baris sudah ada DAN belum expired → return false (lock held)
 *   Jika baris sudah ada TAPI expired → anggap bebas, overwrite
 * - release: DELETE baris lock
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
'server-only';
;
async function acquireDbLock(id, ttlSeconds) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    try {
        // Coba upsert: insert baru ATAU update hanya jika lock sudah expired
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].$executeRaw`
      INSERT INTO "CronLock" ("id", "lockedAt", "expiresAt")
      VALUES (${id}, ${now}, ${expiresAt})
      ON CONFLICT ("id") DO UPDATE
        SET "lockedAt" = ${now}, "expiresAt" = ${expiresAt}
        WHERE "CronLock"."expiresAt" < ${now}
    `;
        // result = jumlah baris yang dimodifikasi
        // 0 = lock masih dipegang (expiresAt belum lewat)
        // 1 = berhasil acquire (baru atau expired)
        return result === 1;
    } catch  {
        // Jika DB error, biarkan job jalan (single-instance cPanel aman)
        return true;
    }
}
async function releaseDbLock(id) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].cronLock.delete({
            where: {
                id
            }
        }).catch(()=>{});
    } catch  {
    // silent
    }
}
async function cleanExpiredLocks() {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].cronLock.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
    } catch  {
    // silent
    }
}
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
 *
 * Menggunakan DB-based distributed lock (pengganti Redis mutex).
 * Tanpa Redis: dipanggil via /api/cron/expire-subscriptions
 * Dengan Redis: BullMQ worker jalan otomatis (backward compatible)
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db-lock.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)");
;
;
;
const LOCK_TTL_SECONDS = 300;
const BATCH_SIZE = 200;
async function runExpireSubscriptions() {
    const locked = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["acquireDbLock"])("cron:expire-subs", LOCK_TTL_SECONDS);
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
                        await tx.subscription.update({
                            where: {
                                id: sub.id
                            },
                            data: {
                                status: "EXPIRED"
                            }
                        });
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
        const cancelledCount = await expireCancelledSubscriptions(now);
        console.log(`[SubExpiry] Done — checked=${checked}, expired=${expired}, cancelled=${cancelledCount}, errors=${errors}`);
    } finally{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["releaseDbLock"])("cron:expire-subs");
    }
    return {
        checked,
        expired,
        errors
    };
}
async function expireCancelledSubscriptions(now) {
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
    if (!connection) {
        console.warn("[SubExpiry] Redis not available — using cron endpoint instead (/api/cron/expire-subscriptions)");
        return null;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Worker } = __turbopack_context__.r("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
        const worker = new Worker("subscriptions", async (job)=>{
            console.log(`[SubExpiry] Job ${job.id} started`);
            return runExpireSubscriptions();
        }, {
            connection
        });
        worker.on("failed", (job, err)=>{
            console.error(`[SubExpiry] Job ${job?.id} failed:`, err);
        });
        return worker;
    } catch  {
        return null;
    }
}
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client-2c3a283f134fdcb6", () => require("@prisma/client-2c3a283f134fdcb6"));

module.exports = mod;
}),
"[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("bullmq-4bb1c7ed12dfb5e0", () => require("bullmq-4bb1c7ed12dfb5e0"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0xeo80p._.js.map