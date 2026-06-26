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
"[project]/src/lib/jobs/cleanupLoginAttempts.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "startCleanupLoginAttemptsWorker",
    ()=>startCleanupLoginAttemptsWorker
]);
/**
 * [9.4] BullMQ Cron — Cleanup LoginAttempt lama (> 30 hari)
 * Berjalan setiap hari pukul 02:00 WIB (19:00 UTC).
 * Menggunakan distributed Redis lock agar tidak double-run di multi-instance.
 *
 * Catatan PRD: AdminAuditLog.adminId is NOT NULL — cron worker tidak bisa menulis
 * ke AdminAuditLog. Cron ini log ke console.error jika gagal (bukan aksi admin).
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$bullmq__$5b$external$5d$__$28$bullmq$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$bullmq$29$__ = __turbopack_context__.i("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
;
;
const QUEUE_NAME = "cron:cleanup-login-attempts";
const MUTEX_KEY = "cron:mutex:cleanup-login-attempts";
const LOCK_TTL_MS = 5 * 60 * 1000; // 5 menit
// BullMQ membutuhkan connection string atau config object — bukan ioredis instance
// karena BullMQ v5 bundel ioredis sendiri (versi berbeda)
function getBullConnection() {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || "6379", 10),
            password: parsed.password || undefined,
            username: parsed.username || undefined,
            tls: parsed.protocol === "rediss:" ? {} : undefined
        };
    } catch  {
        return null;
    }
}
function startCleanupLoginAttemptsWorker() {
    const connection = getBullConnection();
    if (!connection) {
        console.error("[Cron] REDIS_URL tidak tersedia — cleanup LoginAttempt dilewati");
        return null;
    }
    // Buat queue dengan recurring job harian
    const queue = new __TURBOPACK__imported__module__$5b$externals$5d2f$bullmq__$5b$external$5d$__$28$bullmq$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$bullmq$29$__["Queue"](QUEUE_NAME, {
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
    // Worker — proses job
    const worker = new __TURBOPACK__imported__module__$5b$externals$5d2f$bullmq__$5b$external$5d$__$28$bullmq$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$bullmq$29$__["Worker"](QUEUE_NAME, async ()=>{
        // Distributed lock — hanya 1 instance yang boleh jalan
        // Gunakan ioredis dari @/lib/redis untuk lock (bukan BullMQ connection)
        const { redis } = await __turbopack_context__.A("[project]/src/lib/redis.ts [instrumentation] (ecmascript, async loader)");
        if (!redis) return {
            skipped: true,
            reason: "no_redis"
        };
        const lockAcquired = await redis.set(MUTEX_KEY, "1", "PX", LOCK_TTL_MS, "NX");
        if (!lockAcquired) {
            return {
                skipped: true,
                reason: "mutex_locked"
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
            return {
                deleted: result.count,
                cutoff: cutoff.toISOString()
            };
        } finally{
            await redis.del(MUTEX_KEY).catch(()=>{});
        }
    }, {
        connection,
        concurrency: 1
    });
    worker.on("completed", (_job, result)=>{
        if (result?.skipped) return;
        console.error(`[Cron] cleanup-login-attempts selesai: deleted=${result?.deleted ?? 0}`);
    });
    worker.on("failed", (_job, err)=>{
        console.error("[Cron] cleanup-login-attempts GAGAL:", err?.message);
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
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1dl-2b6._.js.map