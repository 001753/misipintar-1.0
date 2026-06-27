module.exports = [
"[externals]/next/dist/build/adapter/setup-node-env.external.js [external] (next/dist/build/adapter/setup-node-env.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/build/adapter/setup-node-env.external.js", () => require("next/dist/build/adapter/setup-node-env.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/memory-cache.external.js [external] (next/dist/server/lib/incremental-cache/memory-cache.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/memory-cache.external.js", () => require("next/dist/server/lib/incremental-cache/memory-cache.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/shared-cache-controls.external.js [external] (next/dist/server/lib/incremental-cache/shared-cache-controls.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js", () => require("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/whatsapp.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalizePhone",
    ()=>normalizePhone,
    "sendWhatsAppOtp",
    ()=>sendWhatsAppOtp,
    "validatePhone",
    ()=>validatePhone
]);
/**
 * WhatsApp OTP Service via Fonnte API
 * Docs: https://fonnte.com/api
 *
 * Env vars required:
 *   FONNTE_TOKEN  — token dari dashboard fonnte.com
 *
 * Jika FONNTE_TOKEN tidak di-set (development), OTP dicetak ke console.
 */ const FONNTE_URL = 'https://api.fonnte.com/send';
function normalizePhone(raw) {
    let p = raw.replace(/\s+/g, '').replace(/-/g, '');
    if (p.startsWith('+')) p = p.slice(1);
    if (p.startsWith('0')) p = '62' + p.slice(1);
    if (!p.startsWith('62')) p = '62' + p;
    return p;
}
function validatePhone(raw) {
    const p = normalizePhone(raw);
    return /^62\d{8,13}$/.test(p);
}
async function sendWhatsAppOtp(phone, otp) {
    const token = process.env.FONNTE_TOKEN;
    const normalized = normalizePhone(phone);
    const message = `🔐 *Kode OTP Misi Pintar*\n\n` + `Kode verifikasi Anda: *${otp}*\n\n` + `Kode berlaku selama *10 menit*.\n` + `Jangan bagikan kode ini kepada siapapun.\n\n` + `_Jika Anda tidak meminta kode ini, abaikan pesan ini._`;
    if (!token) {
        console.warn('[WhatsApp OTP] FONNTE_TOKEN not set — dev mode, printing OTP:');
        console.warn(`  ➜ Phone: ${normalized}  |  OTP: ${otp}`);
        return;
    }
    const res = await fetch(FONNTE_URL, {
        method: 'POST',
        headers: {
            Authorization: token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target: normalized,
            message,
            countryCode: '62'
        })
    });
    if (!res.ok) {
        const body = await res.text().catch(()=>'');
        throw new Error(`Fonnte API error ${res.status}: ${body}`);
    }
    const data = await res.json().catch(()=>({}));
    if (data?.status === false) {
        throw new Error(`Fonnte gagal: ${data?.reason ?? 'unknown'}`);
    }
}
}),
"[project]/src/lib/redis.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/auth/loginGuard.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkLoginRateLimit",
    ()=>checkLoginRateLimit,
    "clearLoginRateLimit",
    ()=>clearLoginRateLimit,
    "recordLoginAttempt",
    ()=>recordLoginAttempt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis.ts [middleware] (ecmascript)");
'server-only';
;
;
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
async function checkLoginRateLimit(identifier, ipAddress) {
    // ── Redis path (lebih cepat) ──────────────────────────
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"]) {
        try {
            const key = `login_attempts:${identifier}`;
            const count = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"].incr(key);
            if (count === 1) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"].expire(key, WINDOW_MINUTES * 60);
            if (count > MAX_ATTEMPTS) {
                throw new Error('RATE_LIMITED');
            }
            return;
        } catch (err) {
            if (err?.message === 'RATE_LIMITED') throw err;
        // Redis error — fallback ke DB
        }
    }
    // ── DB fallback: hitung LoginAttempt gagal dalam window ─
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    const failedCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"].loginAttempt.count({
        where: {
            identifier,
            success: false,
            createdAt: {
                gte: since
            }
        }
    });
    if (failedCount >= MAX_ATTEMPTS) {
        // JANGAN bedakan pesan dengan "password salah" — cegah enumeration attack
        throw new Error('RATE_LIMITED');
    }
}
async function clearLoginRateLimit(identifier) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"]) return;
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["redis"].del(`login_attempts:${identifier}`);
    } catch  {
    // silent — tidak kritis
    }
}
async function recordLoginAttempt(identifier, ipAddress, success) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"].loginAttempt.create({
            data: {
                identifier,
                ipAddress,
                success
            }
        });
    } catch  {
    // silent — jangan blokir login karena error audit
    }
}
}),
"[project]/src/lib/auth/config.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "auth",
    ()=>auth,
    "handlers",
    ()=>handlers,
    "signIn",
    ()=>signIn,
    "signOut",
    ()=>signOut
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@auth/core/providers/credentials.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [middleware] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/loginGuard.ts [middleware] (ecmascript)");
;
;
;
;
;
;
;
const parentLoginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const childLoginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    spaceCode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().length(6),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const { handlers, auth, signIn, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["default"])({
            id: 'parent-credentials',
            name: 'Parent',
            credentials: {
                phone: {
                    label: 'No. WhatsApp',
                    type: 'text'
                },
                password: {
                    label: 'Password',
                    type: 'password'
                }
            },
            async authorize (credentials, request) {
                const parsed = parentLoginSchema.safeParse(credentials);
                if (!parsed.success) return null;
                const { phone, password } = parsed.data;
                const normalizedPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["normalizePhone"])(phone);
                const ip = request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["checkLoginRateLimit"])(normalizedPhone, ip);
                // Cari user via phone (parent baru) atau email (superadmin legacy)
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
                    where: {
                        OR: [
                            {
                                phone: normalizedPhone
                            },
                            {
                                email: phone
                            }
                        ]
                    },
                    include: {
                        familySpace: true
                    }
                });
                if (!user) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(normalizedPhone, ip, false);
                    return null;
                }
                const valid = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["default"].compare(password, user.passwordHash);
                if (!valid) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(normalizedPhone, ip, false);
                    return null;
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(normalizedPhone, ip, true);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["clearLoginRateLimit"])(normalizedPhone);
                return {
                    id: user.id,
                    email: user.email ?? user.phone ?? '',
                    name: user.name,
                    role: user.role,
                    familySpaceId: user.familySpaceId,
                    childId: null,
                    phone: user.phone
                };
            }
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["default"])({
            id: 'child-credentials',
            name: 'Child',
            credentials: {
                spaceCode: {
                    label: 'Kode Keluarga',
                    type: 'text'
                },
                username: {
                    label: 'Username',
                    type: 'text'
                },
                password: {
                    label: 'Password',
                    type: 'password'
                }
            },
            async authorize (credentials, request) {
                const parsed = childLoginSchema.safeParse(credentials);
                if (!parsed.success) return null;
                const { spaceCode, username, password } = parsed.data;
                const identifier = `${spaceCode}:${username}`;
                const ip = request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["checkLoginRateLimit"])(identifier, ip);
                const familySpace = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"].familySpace.findUnique({
                    where: {
                        spaceCode
                    }
                });
                if (!familySpace) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, false);
                    return null;
                }
                const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
                    where: {
                        familySpaceId_username: {
                            familySpaceId: familySpace.id,
                            username
                        }
                    }
                });
                if (!child || child.deletedAt) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, false);
                    return null;
                }
                const valid = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["default"].compare(password, child.passwordHash);
                if (!valid) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, false);
                    return null;
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, true);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["clearLoginRateLimit"])(identifier);
                return {
                    id: child.id,
                    name: child.name,
                    email: null,
                    role: 'CHILD',
                    familySpaceId: familySpace.id,
                    childId: child.id,
                    phone: null
                };
            }
        })
    ],
    callbacks: {
        async jwt ({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.familySpaceId = user.familySpaceId ?? null;
                token.childId = user.childId ?? null;
                token.phone = user.phone ?? null;
            }
            return token;
        },
        async session ({ session, token }) {
            const t = token;
            session.user.id = t.id;
            session.user.role = t.role;
            session.user.familySpaceId = t.familySpaceId ?? null;
            session.user.childId = t.childId ?? null;
            session.user.phone = t.phone ?? null;
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login'
    },
    session: {
        strategy: 'jwt'
    },
    secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
    trustHost: true
});
}),
"[project]/src/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/config.ts [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
;
;
// [6.1] IP allowlist opsional untuk /superadmin/*
// Set SUPERADMIN_ALLOWED_IPS=1.2.3.4,5.6.7.8 di env untuk membatasi akses
function checkSuperadminIP(req) {
    const raw = process.env.SUPERADMIN_ALLOWED_IPS;
    if (!raw) return true // tidak ada allowlist = semua IP boleh
    ;
    const allowed = raw.split(',').map((ip)=>ip.trim()).filter(Boolean);
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
    return allowed.includes(clientIP);
}
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__["auth"])((req)=>{
    const { pathname } = req.nextUrl;
    const session = req.auth;
    const role = session?.user?.role;
    // ─── Tidak terautentikasi ─────────────────────────────
    if (!session) {
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/child') || pathname.startsWith('/superadmin')) {
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // ─── Route /dashboard/* → hanya PARENT ───────────────
    if (pathname.startsWith('/dashboard') && role !== 'PARENT') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/unauthorized', req.url));
    }
    // ─── Route /child/* → hanya CHILD ────────────────────
    if (pathname.startsWith('/child') && role !== 'CHILD') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/unauthorized', req.url));
    }
    // ─── Route /superadmin/* → hanya SUPER_ADMIN + IP allowlist ─────────
    if (pathname.startsWith('/superadmin')) {
        if (role !== 'SUPER_ADMIN') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/unauthorized', req.url));
        }
        if (!checkSuperadminIP(req)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Forbidden — IP not allowed'
            }, {
                status: 403
            });
        }
    }
    // ─── Redirect ke dashboard jika sudah login ───────────
    if (pathname === '/login' || pathname === '/register') {
        if (role === 'PARENT') return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/dashboard', req.url));
        if (role === 'CHILD') return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/child/dashboard', req.url));
        if (role === 'SUPER_ADMIN') return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/superadmin', req.url));
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next();
});
const config = {
    matcher: [
        '/dashboard/:path*',
        '/child/:path*',
        '/superadmin/:path*',
        '/login',
        '/register'
    ]
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0jwd7ab._.js.map