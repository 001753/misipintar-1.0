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
    const { PrismaClient } = (()=>{
        const e = new Error("Cannot find module '@prisma/client'");
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    })();
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
"[project]/src/queues/workers/interest.worker.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runInterestEngine",
    ()=>runInterestEngine,
    "runTaxEngine",
    ()=>runTaxEngine,
    "startInterestWorker",
    ()=>startInterestWorker
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$bullmq__$5b$external$5d$__$28$bullmq$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$bullmq$29$__ = __turbopack_context__.i("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)");
;
;
;
;
const LOCK_KEY = "cron:mutex:interest";
const LOCK_TTL_SECONDS = 300; // 5 menit
const BATCH_SIZE = 500;
async function acquireLock() {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return false;
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].set(LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
    return result === "OK";
}
async function releaseLock() {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return;
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].del(LOCK_KEY);
}
async function runInterestEngine() {
    const locked = await acquireLock();
    if (!locked) {
        console.log("[InterestWorker] Skipped — lock held by another instance");
        return {
            processed: 0,
            credited: 0,
            totalInterest: 0
        };
    }
    let cursor = 0;
    let processed = 0;
    let credited = 0;
    let totalInterest = 0;
    try {
        // Ambil AppConfig untuk interestRate
        const appConfig = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].appConfig.findUnique({
            where: {
                id: "global-config"
            }
        });
        const configData = appConfig?.data ?? {};
        const interestRate = typeof configData.interestRate === "number" ? configData.interestRate : 2; // default 2%
        while(true){
            const children = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].child.findMany({
                where: {
                    deletedAt: null,
                    savingsBalance: {
                        gt: 0
                    },
                    familySpace: {
                        subscription: {
                            // Hanya proses bunga untuk langganan yang masih aktif
                            status: {
                                in: [
                                    "TRIAL",
                                    "PRO",
                                    "EDUCATOR",
                                    "SCHOOL"
                                ]
                            },
                            plan: {
                                // hasInterest is stored in plan.limits JSON
                                NOT: {
                                    limits: {}
                                }
                            }
                        }
                    }
                },
                include: {
                    familySpace: {
                        include: {
                            subscription: {
                                include: {
                                    plan: true
                                }
                            }
                        }
                    }
                },
                skip: cursor,
                take: BATCH_SIZE,
                orderBy: {
                    createdAt: "asc"
                }
            });
            if (children.length === 0) break;
            for (const child of children){
                const limits = child.familySpace.subscription?.plan?.limits;
                if (!limits?.hasInterest) {
                    processed++;
                    continue;
                }
                const rate = typeof limits.interestRate === "number" ? limits.interestRate : interestRate;
                const interest = Math.floor(child.savingsBalance * (rate / 100));
                if (interest <= 0) {
                    processed++;
                    continue;
                }
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
                        const before = await tx.child.findUniqueOrThrow({
                            where: {
                                id: child.id
                            },
                            select: {
                                savingsBalance: true
                            }
                        });
                        const updated = await tx.child.update({
                            where: {
                                id: child.id
                            },
                            data: {
                                savingsBalance: {
                                    increment: interest
                                }
                            },
                            select: {
                                savingsBalance: true
                            }
                        });
                        await tx.transactionLedger.create({
                            data: {
                                familySpaceId: child.familySpaceId,
                                childId: child.id,
                                type: "INTEREST",
                                amount: interest,
                                balanceBefore: before.savingsBalance,
                                balanceAfter: updated.savingsBalance,
                                description: `Bunga tabungan ${rate}% harian`
                            }
                        });
                    });
                    credited++;
                    totalInterest += interest;
                } catch (err) {
                    console.error(`[InterestWorker] Failed for child ${child.id}:`, err);
                }
                processed++;
            }
            cursor += BATCH_SIZE;
            if (children.length < BATCH_SIZE) break;
        }
        // Log summary (AdminAuditLog requires adminId — cron has no actor, use console only)
        console.log(`[InterestWorker] Done — processed=${processed}, credited=${credited}, totalInterest=${totalInterest}`);
    } finally{
        await releaseLock();
    }
    return {
        processed,
        credited,
        totalInterest
    };
}
// ─────────────────────────────────────────────────────────
// [3.3] Tax Engine (PRO+ hasTax = true)
// ─────────────────────────────────────────────────────────
const TAX_LOCK_KEY = "cron:mutex:tax";
async function runTaxEngine() {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return {
        processed: 0,
        taxed: 0,
        totalTax: 0
    };
    const taxLocked = await (async ()=>{
        const r = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].set(TAX_LOCK_KEY, "1", "EX", LOCK_TTL_SECONDS, "NX");
        return r === "OK";
    })();
    if (!taxLocked) {
        console.log("[TaxWorker] Skipped — lock held by another instance");
        return {
            processed: 0,
            taxed: 0,
            totalTax: 0
        };
    }
    let cursor = 0;
    let processed = 0;
    let taxed = 0;
    let totalTax = 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    try {
        while(true){
            const children = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].child.findMany({
                where: {
                    deletedAt: null,
                    familySpace: {
                        subscription: {
                            // Hanya kenakan pajak untuk langganan yang masih aktif
                            status: {
                                in: [
                                    "TRIAL",
                                    "PRO",
                                    "EDUCATOR",
                                    "SCHOOL"
                                ]
                            },
                            plan: {
                                NOT: {
                                    limits: {}
                                }
                            }
                        }
                    }
                },
                include: {
                    familySpace: {
                        include: {
                            subscription: {
                                include: {
                                    plan: true
                                }
                            }
                        }
                    }
                },
                skip: cursor,
                take: BATCH_SIZE,
                orderBy: {
                    createdAt: "asc"
                }
            });
            if (children.length === 0) break;
            for (const child of children){
                const limits = child.familySpace.subscription?.plan?.limits;
                if (!limits?.hasTax) {
                    processed++;
                    continue;
                }
                const taxRate = typeof limits.taxRate === "number" ? limits.taxRate : 5;
                // Hitung total reward bulan lalu
                const lastMonthRewards = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].transactionLedger.aggregate({
                    where: {
                        childId: child.id,
                        type: "TASK_REWARD",
                        createdAt: {
                            gte: monthStart,
                            lt: monthEnd
                        }
                    },
                    _sum: {
                        amount: true
                    }
                });
                const rewardTotal = lastMonthRewards._sum.amount ?? 0;
                const taxAmount = Math.floor(rewardTotal * (taxRate / 100));
                if (taxAmount <= 0) {
                    processed++;
                    continue;
                }
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
                        const current = await tx.child.findUniqueOrThrow({
                            where: {
                                id: child.id
                            },
                            select: {
                                balance: true
                            }
                        });
                        if (current.balance < taxAmount) return; // skip jika saldo tidak cukup
                        const updated = await tx.child.update({
                            where: {
                                id: child.id
                            },
                            data: {
                                balance: {
                                    decrement: taxAmount
                                }
                            },
                            select: {
                                balance: true
                            }
                        });
                        await tx.transactionLedger.create({
                            data: {
                                familySpaceId: child.familySpaceId,
                                childId: child.id,
                                type: "TAX",
                                amount: -taxAmount,
                                balanceBefore: current.balance,
                                balanceAfter: updated.balance,
                                description: `Pajak virtual ${taxRate}% dari reward bulan ${monthStart.toLocaleDateString("id-ID", {
                                    month: "long",
                                    year: "numeric"
                                })}`,
                                refId: `tax-${monthStart.toISOString().substring(0, 7)}`
                            }
                        });
                    });
                    taxed++;
                    totalTax += taxAmount;
                } catch (err) {
                    console.error(`[TaxWorker] Failed for child ${child.id}:`, err);
                }
                processed++;
            }
            cursor += BATCH_SIZE;
            if (children.length < BATCH_SIZE) break;
        }
        console.log(`[TaxWorker] Done — processed=${processed}, taxed=${taxed}, totalTax=${totalTax}`);
    } finally{
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].del(TAX_LOCK_KEY);
    }
    return {
        processed,
        taxed,
        totalTax
    };
}
function startInterestWorker() {
    const connection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getBullConnection"])();
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"] || !connection) {
        console.warn("[InterestWorker] Redis not available — interest cron disabled");
        return null;
    }
    const worker = new __TURBOPACK__imported__module__$5b$externals$5d2f$bullmq__$5b$external$5d$__$28$bullmq$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$bullmq$29$__["Worker"]("interest", async (job)=>{
        console.log(`[InterestWorker] Job ${job.id} started`);
        if (job.data?.type === "TAX") {
            return runTaxEngine();
        }
        return runInterestEngine();
    }, {
        connection
    });
    worker.on("failed", (job, err)=>{
        console.error(`[InterestWorker] Job ${job?.id} failed:`, err);
    });
    return worker;
}
;
}),
"[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("bullmq-4bb1c7ed12dfb5e0", () => require("bullmq-4bb1c7ed12dfb5e0"));

module.exports = mod;
}),
"[externals]/ioredis [external] (ioredis, cjs, [project]/node_modules/ioredis)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("ioredis-23a6225d3f8c0bff", () => require("ioredis-23a6225d3f8c0bff"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__17ivtwu._.js.map