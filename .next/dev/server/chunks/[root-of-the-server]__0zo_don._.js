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
"[project]/src/lib/jobs/cleanupLoginAttempts.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "runCleanupLoginAttempts",
    ()=>runCleanupLoginAttempts,
    "startCleanupLoginAttemptsWorker",
    ()=>startCleanupLoginAttemptsWorker
]);
/**
 * [9.4] Cleanup LoginAttempt lama (> 30 hari)
 *
 * Strategi:
 * - Jika Redis tersedia: BullMQ worker via cron (require lazy)
 * - Jika tidak ada Redis: cron endpoint /api/cron/cleanup-login-attempts
 *
 * bullmq dan Queue/Worker di-require() secara lazy di dalam fungsi — BUKAN
 * static import di atas — karena static import menyebabkan @msgpackr-extract
 * native addon termuat saat build worker → SIGABRT di cPanel.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db-lock.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)");
;
;
;
async function runCleanupLoginAttempts() {
    const locked = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["acquireDbLock"])("cron:cleanup-login-attempts", 300);
    if (!locked) {
        console.log("[Cron] cleanup-login-attempts — lock held, skipped");
        return {
            deleted: 0,
            cutoff: ""
        };
    }
    try {
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].loginAttempt.deleteMany({
            where: {
                createdAt: {
                    lt: cutoff
                }
            }
        });
        console.log(`[Cron] cleanup-login-attempts: deleted=${result.count}`);
        return {
            deleted: result.count,
            cutoff: cutoff.toISOString()
        };
    } finally{
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2d$lock$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["releaseDbLock"])("cron:cleanup-login-attempts");
    }
}
function startCleanupLoginAttemptsWorker() {
    const connection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getBullConnection"])();
    if (!connection) {
        console.error("[Cron] REDIS_URL tidak tersedia — cleanup LoginAttempt dilewati (gunakan /api/cron/cleanup-login-attempts)");
        return null;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Queue, Worker } = __turbopack_context__.r("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
        const QUEUE_NAME = "cron:cleanup-login-attempts";
        const queue = new Queue(QUEUE_NAME, {
            connection
        });
        queue.add("cleanup", {}, {
            repeat: {
                pattern: "0 19 * * *"
            },
            jobId: "cleanup-login-attempts-daily",
            removeOnComplete: {
                count: 3
            },
            removeOnFail: {
                count: 5
            }
        }).catch((err)=>console.error("[Cron] Gagal mendaftarkan recurring job:", err));
        const worker = new Worker(QUEUE_NAME, async ()=>runCleanupLoginAttempts(), {
            connection,
            concurrency: 1
        });
        worker.on("completed", (_job, result)=>{
            if (result?.skipped) return;
            console.log(`[Cron] cleanup-login-attempts selesai: deleted=${result?.deleted ?? 0}`);
        });
        worker.on("failed", (_job, err)=>{
            console.error("[Cron] cleanup-login-attempts GAGAL:", err?.message);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0zo_don._.js.map