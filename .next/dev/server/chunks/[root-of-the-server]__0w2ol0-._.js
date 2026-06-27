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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db-lock.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)");
;
;
;
const LOCK_TTL_SECONDS = 300; // 5 menit
const BATCH_SIZE = 500;
async function runInterestEngine() {
    const locked = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["acquireDbLock"])("cron:interest", LOCK_TTL_SECONDS);
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
        const appConfig = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].appConfig.findUnique({
            where: {
                id: "global-config"
            }
        });
        const configData = appConfig?.data ?? {};
        const interestRate = typeof configData.interestRate === "number" ? configData.interestRate : 2;
        while(true){
            const children = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].child.findMany({
                where: {
                    deletedAt: null,
                    savingsBalance: {
                        gt: 0
                    },
                    familySpace: {
                        subscription: {
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
        console.log(`[InterestWorker] Done — processed=${processed}, credited=${credited}, totalInterest=${totalInterest}`);
    } finally{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["releaseDbLock"])("cron:interest");
    }
    return {
        processed,
        credited,
        totalInterest
    };
}
async function runTaxEngine() {
    const locked = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["acquireDbLock"])("cron:tax", LOCK_TTL_SECONDS);
    if (!locked) {
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
                        if (current.balance < taxAmount) return;
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
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["releaseDbLock"])("cron:tax");
    }
    return {
        processed,
        taxed,
        totalTax
    };
}
function startInterestWorker() {
    const connection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getBullConnection"])();
    if (!connection) {
        console.warn("[InterestWorker] Redis not available — using cron endpoints instead (/api/cron/interest, /api/cron/tax)");
        return null;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Worker } = __turbopack_context__.r("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
        const worker = new Worker("interest", async (job)=>{
            console.log(`[InterestWorker] Job ${job.id} started`);
            if (job.data?.type === "TAX") return runTaxEngine();
            return runInterestEngine();
        }, {
            connection
        });
        worker.on("failed", (job, err)=>{
            console.error(`[InterestWorker] Job ${job?.id} failed:`, err);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0w2ol0-._.js.map