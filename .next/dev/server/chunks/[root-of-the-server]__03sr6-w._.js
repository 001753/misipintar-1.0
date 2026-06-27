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
"[project]/src/lib/notifications/fcm.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getChildFcmTokens",
    ()=>getChildFcmTokens,
    "getUserFcmTokens",
    ()=>getUserFcmTokens,
    "sendPushNotification",
    ()=>sendPushNotification
]);
/**
 * [5.1] Firebase Admin SDK — FCM Push Notifications
 * Lazy init, build-safe: firebase-admin tidak di-load saat NEXT_BUILD=1
 * atau saat env vars Firebase tidak tersedia.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [instrumentation] (ecmascript)");
;
let _messaging = null;
async function getMessaging() {
    if (process.env.NEXT_BUILD === '1') return null;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (_messaging) return _messaging;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
        console.log('[FCM] Firebase env tidak lengkap — push notifications dinonaktifkan');
        return null;
    }
    try {
        const { initializeApp, getApps, cert } = await __turbopack_context__.A("[externals]/firebase-admin/app [external] (firebase-admin/app, esm_import, [project]/node_modules/firebase-admin, async loader)");
        const { getMessaging: _getMessaging } = await __turbopack_context__.A("[externals]/firebase-admin/messaging [external] (firebase-admin/messaging, esm_import, [project]/node_modules/firebase-admin, async loader)");
        const app = getApps().length === 0 ? initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n')
            })
        }) : getApps()[0];
        _messaging = _getMessaging(app);
        return _messaging;
    } catch (err) {
        console.error('[FCM] Gagal init firebase-admin:', err);
        return null;
    }
}
async function sendPushNotification(tokens, title, body, data) {
    if (tokens.length === 0) return {
        successCount: 0,
        failureCount: 0
    };
    const messaging = await getMessaging();
    if (!messaging) return {
        successCount: 0,
        failureCount: 0
    };
    try {
        const response = await messaging.sendEachForMulticast({
            tokens,
            notification: {
                title,
                body
            },
            data: data ?? {},
            android: {
                priority: 'high',
                notification: {
                    channelId: 'misi-pintar-default'
                }
            }
        });
        const invalidTokens = [];
        response.responses.forEach((res, idx)=>{
            if (!res.success) {
                const code = res.error?.code;
                if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
                    invalidTokens.push(tokens[idx]);
                }
            }
        });
        if (invalidTokens.length > 0) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].fcmToken.deleteMany({
                where: {
                    token: {
                        in: invalidTokens
                    }
                }
            });
            console.log(`[FCM] Removed ${invalidTokens.length} invalid token(s)`);
        }
        return {
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (err) {
        console.error('[FCM] sendEachForMulticast error:', err);
        return {
            successCount: 0,
            failureCount: tokens.length
        };
    }
}
async function getUserFcmTokens(userId) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].fcmToken.findMany({
        where: {
            userId
        },
        select: {
            token: true
        }
    });
    return rows.map((r)=>r.token);
}
async function getChildFcmTokens(childId) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["prisma"].fcmToken.findMany({
        where: {
            childId
        },
        select: {
            token: true
        }
    });
    return rows.map((r)=>r.token);
}
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
"[project]/src/lib/notifications/sse.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUnreadCount",
    ()=>getUnreadCount,
    "incrementUnreadBadge",
    ()=>incrementUnreadBadge,
    "publishToFamily",
    ()=>publishToFamily,
    "resetUnreadBadge",
    ()=>resetUnreadBadge
]);
/**
 * [5.2] SSE Helper — Publish ke Redis channel keluarga.
 * Server Actions memanggil publishToFamily() untuk kirim event real-time.
 * JANGAN polling database — hanya Redis pub/sub.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis.ts [instrumentation] (ecmascript)");
;
async function publishToFamily(familySpaceId, event) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return;
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].publish(`sse:family:${familySpaceId}`, JSON.stringify(event));
    } catch (err) {
        console.error("[SSE] publishToFamily error:", err);
    }
}
async function incrementUnreadBadge(userId) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return;
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].incr(`notif:unread:${userId}`);
    } catch  {
    // non-fatal
    }
}
async function resetUnreadBadge(userId) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return;
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].del(`notif:unread:${userId}`);
    } catch  {
    // non-fatal
    }
}
async function getUnreadCount(userId) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"]) return 0;
    try {
        const val = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["redis"].get(`notif:unread:${userId}`);
        return parseInt(val ?? "0", 10) || 0;
    } catch  {
        return 0;
    }
}
}),
"[project]/src/queues/workers/notification.worker.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "startNotificationWorker",
    ()=>startNotificationWorker
]);
/**
 * [5.1] Notification Worker — FCM Push + SSE real-time dispatch.
 * Consumes the "notifications" BullMQ queue.
 * Runs only when REDIS_URL is configured (graceful no-op otherwise).
 *
 * bullmq di-require() secara lazy di dalam startNotificationWorker() — BUKAN
 * static import di atas — karena `import { Worker } from 'bullmq'` menyebabkan
 * @msgpackr-extract native addon termuat saat build worker → SIGABRT.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis-bull.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notifications/fcm.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$sse$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notifications/sse.ts [instrumentation] (ecmascript)");
;
;
;
function startNotificationWorker() {
    const connection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2d$bull$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getBullConnection"])();
    if (!connection) {
        console.warn('[NotificationWorker] Redis not available — worker disabled');
        return null;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Worker } = __turbopack_context__.r("[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)");
        const worker = new Worker('notifications', async (job)=>{
            const { type, familySpaceId, targetUserId, targetChildId, title, body, data } = job.data;
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$sse$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["publishToFamily"])(familySpaceId, {
                type,
                payload: {
                    title,
                    body,
                    ...data ?? {}
                }
            });
            const tokens = [];
            if (targetUserId) {
                tokens.push(...await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getUserFcmTokens"])(targetUserId));
            }
            if (targetChildId) {
                tokens.push(...await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getChildFcmTokens"])(targetChildId));
            }
            let fcmResult = {
                successCount: 0,
                failureCount: 0
            };
            if (tokens.length > 0) {
                fcmResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["sendPushNotification"])(tokens, title, body, data);
            }
            if (targetUserId) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$sse$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["incrementUnreadBadge"])(targetUserId);
            }
            return {
                type,
                sse: true,
                fcm: {
                    tokens: tokens.length,
                    ...fcmResult
                }
            };
        }, {
            connection,
            concurrency: 5
        });
        worker.on('completed', (job, result)=>{
            console.log(`[NotificationWorker] Job ${job.id} done — sse=${result.sse} fcm_sent=${result.fcm.successCount}`);
        });
        worker.on('failed', (job, err)=>{
            console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
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
"[externals]/ioredis [external] (ioredis, cjs, [project]/node_modules/ioredis)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("ioredis-23a6225d3f8c0bff", () => require("ioredis-23a6225d3f8c0bff"));

module.exports = mod;
}),
"[externals]/bullmq [external] (bullmq, cjs, [project]/node_modules/bullmq)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("bullmq-4bb1c7ed12dfb5e0", () => require("bullmq-4bb1c7ed12dfb5e0"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__03sr6-w._.js.map