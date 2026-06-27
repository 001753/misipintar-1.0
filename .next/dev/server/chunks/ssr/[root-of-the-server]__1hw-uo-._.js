module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/app/favicon.ico (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/favicon.2vob68tjqpejf.ico" + (globalThis["NEXT_CLIENT_ASSET_SUFFIX"] || ''));}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/src/app/favicon.ico (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 256,
    height: 256
};
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/whatsapp.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/redis.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/lib/auth/loginGuard.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkLoginRateLimit",
    ()=>checkLoginRateLimit,
    "clearLoginRateLimit",
    ()=>clearLoginRateLimit,
    "recordLoginAttempt",
    ()=>recordLoginAttempt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redis.ts [app-rsc] (ecmascript)");
'server-only';
;
;
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
async function checkLoginRateLimit(identifier, ipAddress) {
    // ── Redis path (lebih cepat) ──────────────────────────
    if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redis"]) {
        try {
            const key = `login_attempts:${identifier}`;
            const count = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redis"].incr(key);
            if (count === 1) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redis"].expire(key, WINDOW_MINUTES * 60);
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
    const failedCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].loginAttempt.count({
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
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redis"]) return;
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redis$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redis"].del(`login_attempts:${identifier}`);
    } catch  {
    // silent — tidak kritis
    }
}
async function recordLoginAttempt(identifier, ipAddress, success) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].loginAttempt.create({
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
"[project]/src/lib/auth/config.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next-auth/providers/credentials.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@auth/core/providers/credentials.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/loginGuard.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const parentLoginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const childLoginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    spaceCode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().length(6),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1)
});
const { handlers, auth, signIn, signOut } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])({
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])({
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
                const normalizedPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(phone);
                const ip = request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkLoginRateLimit"])(normalizedPhone, ip);
                // Cari user via phone (parent baru) atau email (superadmin legacy)
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
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
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(normalizedPhone, ip, false);
                    return null;
                }
                const valid = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].compare(password, user.passwordHash);
                if (!valid) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(normalizedPhone, ip, false);
                    return null;
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(normalizedPhone, ip, true);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clearLoginRateLimit"])(normalizedPhone);
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$auth$2f$core$2f$providers$2f$credentials$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])({
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
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkLoginRateLimit"])(identifier, ip);
                const familySpace = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].familySpace.findUnique({
                    where: {
                        spaceCode
                    }
                });
                if (!familySpace) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, false);
                    return null;
                }
                const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
                    where: {
                        familySpaceId_username: {
                            familySpaceId: familySpace.id,
                            username
                        }
                    }
                });
                if (!child || child.deletedAt) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, false);
                    return null;
                }
                const valid = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].compare(password, child.passwordHash);
                if (!valid) {
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, false);
                    return null;
                }
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["recordLoginAttempt"])(identifier, ip, true);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$loginGuard$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clearLoginRateLimit"])(identifier);
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
"[project]/src/components/landing/LandingPage.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/components/landing/LandingPage.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/landing/LandingPage.tsx <module evaluation>", "default");
}),
"[project]/src/components/landing/LandingPage.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/components/landing/LandingPage.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/landing/LandingPage.tsx", "default");
}),
"[project]/src/components/landing/LandingPage.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$landing$2f$LandingPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/landing/LandingPage.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$landing$2f$LandingPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/components/landing/LandingPage.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$landing$2f$LandingPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/components/JsonLd.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>JsonLd
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function JsonLd({ schema }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(schema)
        }
    }, void 0, false, {
        fileName: "[project]/src/components/JsonLd.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HomePage,
    "dynamic",
    ()=>dynamic,
    "metadata",
    ()=>metadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$landing$2f$LandingPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/landing/LandingPage.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$JsonLd$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/JsonLd.tsx [app-rsc] (ecmascript)");
;
const dynamic = 'force-dynamic';
;
;
;
;
const metadata = {
    title: {
        absolute: 'MisiPintar - Ubah Kuota Marah-Marah Jadi Kuota Senyuman'
    },
    description: 'Ubah PR sekolah, baca buku, dan tugas rumah jadi misi seru berhadiah saldo saku virtual. Anak belajar mandiri, orang tua tenang. Gratis selamanya.',
    keywords: [
        'aplikasi uang saku anak',
        'literasi keuangan anak',
        'tabungan virtual anak',
        'misi pintar',
        'aplikasi tugas anak',
        'familyspace',
        'jobenapps'
    ],
    alternates: {
        canonical: 'https://mp.jobenapp.cloud'
    },
    openGraph: {
        title: 'MisiPintar - Ubah Kuota Marah-Marah Jadi Kuota Senyuman',
        description: 'Misi seru berhadiah saldo virtual. Anak belajar nilai kerja keras, orang tua tenang. 100% gratis selamanya.',
        url: 'https://mp.jobenapp.cloud',
        siteName: 'MisiPintar',
        locale: 'id_ID',
        type: 'website'
    }
};
const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MisiPintar',
    alternateName: 'JobenApps',
    url: 'https://mp.jobenapp.cloud',
    logo: {
        '@type': 'ImageObject',
        url: 'https://mp.jobenapp.cloud/logo.png',
        width: 512,
        height: 512
    },
    description: 'Platform literasi keuangan dan gamifikasi keluarga #1 Indonesia. Ubah tugas anak menjadi misi seru berhadiah saldo virtual.',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Sentra Town, The Park Mall Solo Baru',
        addressLocality: 'Solo',
        addressRegion: 'Jawa Tengah',
        addressCountry: 'ID'
    },
    contactPoint: [
        {
            '@type': 'ContactPoint',
            telephone: '+62-814-6008-1343',
            contactType: 'customer support',
            contactOption: 'TollFree',
            areaServed: 'ID',
            availableLanguage: 'Indonesian'
        },
        {
            '@type': 'ContactPoint',
            email: 'admin@jobenapp.cloud',
            contactType: 'customer support',
            areaServed: 'ID',
            availableLanguage: 'Indonesian'
        }
    ],
    founder: {
        '@type': 'Organization',
        name: 'Joben Enterprise'
    },
    foundingLocation: {
        '@type': 'Place',
        name: 'Solo, Jawa Tengah, Indonesia'
    },
    areaServed: {
        '@type': 'Country',
        name: 'Indonesia'
    }
};
const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MisiPintar',
    alternateName: 'Misi Pintar',
    url: 'https://mp.jobenapp.cloud',
    description: 'Platform gamifikasi keuangan keluarga #1 Indonesia. Buat misi, kumpulkan reward, dan bangun karakter anak sejak dini.',
    inLanguage: 'id-ID',
    publisher: {
        '@type': 'Organization',
        name: 'MisiPintar',
        url: 'https://mp.jobenapp.cloud'
    },
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://mp.jobenapp.cloud/?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
    }
};
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Apakah ini tidak membuat anak bermental matre/pamrih?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Justru sebaliknya. Misi Pintar mengajarkan bahwa uang adalah hasil dari kerja dan tanggung jawab — bukan sesuatu yang didapat gratis. Sistem reward dikaitkan dengan prestasi nyata dan nilai-nilai karakter, bukan sekadar "minta dan dapat". Penelitian menunjukkan anak yang belajar nilai uang sejak dini justru lebih bijak finansial saat dewasa.'
            }
        },
        {
            '@type': 'Question',
            name: 'Bagaimana jika saldo virtual dihabiskan untuk hal tidak berguna?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Orang tua punya kontrol penuh. Anda bisa mengatur ke mana saldo bisa digunakan — hanya untuk tabungan, atau bisa juga untuk "beli" hadiah virtual yang sudah Anda setujui. Ini justru sarana latihan membuat keputusan finansial dalam lingkungan yang aman dan terkontrol.'
            }
        },
        {
            '@type': 'Question',
            name: 'Apakah saldo virtual bisa dicairkan ke uang sungguhan?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Saldo virtual adalah representasi digital dari uang nyata yang sudah Anda janjikan. Cara pencairan terserah kesepakatan keluarga — bisa transfer langsung, atau ditukar hadiah fisik. Misi Pintar tidak terhubung ke sistem perbankan, sehingga sepenuhnya aman dan dalam kendali orang tua.'
            }
        },
        {
            '@type': 'Question',
            name: 'Berapa usia anak yang cocok menggunakan Misi Pintar?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Usia 5–15 tahun adalah rentang ideal. Anak usia 5–7 tahun bisa mulai dengan misi sederhana. Usia 8–12 tahun adalah fase emas dengan fitur penuh. Usia 13–15 tahun dapat menggunakan fitur tabungan bertujuan yang lebih kompleks untuk persiapan finansial remaja.'
            }
        },
        {
            '@type': 'Question',
            name: 'Apakah data keluarga aman dan privat?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Keamanan adalah prioritas utama. Data keluarga dienkripsi end-to-end, tidak dibagikan ke pihak ketiga, tidak ada iklan berbasis data anak. Kami mematuhi regulasi perlindungan data anak. Tidak ada informasi bank atau kartu kredit yang diperlukan.'
            }
        },
        {
            '@type': 'Question',
            name: 'Berapa lama fase gratis ini berlaku?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Kami berkomitmen memberikan akses gratis untuk 1 juta keluarga pertama sebagai bagian dari misi kami membangun Indonesia yang melek keuangan. Slot masih tersedia — daftar sekarang untuk mengunci akses gratis Anda.'
            }
        },
        {
            '@type': 'Question',
            name: 'Apa bedanya fitur Tabungan Virtual dengan celengan biasa?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Celengan biasa tidak punya tujuan, tidak ada bunga reward, tidak ada kunci komitmen, dan tidak ada momen perayaan. Kantong Impian Misi Pintar mengajarkan goal-based saving — anak menetapkan target spesifik, melihat progresnya setiap hari, mendapatkan bunga dari orang tua, dan merayakan pencapaian bersama keluarga.'
            }
        },
        {
            '@type': 'Question',
            name: 'Apakah bisa digunakan untuk lebih dari satu anak?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Ya! Satu FamilySpace bisa menampung beberapa profil anak sekaligus. Setiap anak punya dashboard sendiri, saldo terpisah, dan misi yang bisa dibedakan sesuai usia dan kebutuhan. Bahkan anak-anak bisa melihat progress satu sama lain sebagai motivasi.'
            }
        }
    ]
};
async function HomePage() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (session) {
        const role = session.user.role;
        if (role === 'PARENT') (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/dashboard');
        if (role === 'CHILD') (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/child/dashboard');
        if (role === 'SUPER_ADMIN') (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/superadmin');
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$JsonLd$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                schema: organizationSchema
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 196,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$JsonLd$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                schema: webSiteSchema
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$JsonLd$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                schema: faqSchema
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 198,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$landing$2f$LandingPage$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 199,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/src/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1hw-uo-._.js.map