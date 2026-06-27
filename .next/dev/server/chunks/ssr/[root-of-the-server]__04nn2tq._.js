module.exports = [
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
"[project]/src/lib/auth/passwordPolicy.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "childPasswordSchema",
    ()=>childPasswordSchema,
    "parentPasswordSchema",
    ()=>parentPasswordSchema,
    "validateChildPassword",
    ()=>validateChildPassword,
    "validateParentPassword",
    ()=>validateParentPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
;
const childPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(6, 'Password minimal 6 karakter').refine((val)=>val.trim().length > 0, 'Password tidak boleh kosong');
function validateChildPassword(password, username) {
    childPasswordSchema.parse(password);
    if (password.toLowerCase() === username.toLowerCase()) {
        throw new Error('Password tidak boleh sama dengan username');
    }
}
const parentPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, 'Password minimal 8 karakter').regex(/[A-Z]/, 'Harus ada minimal 1 huruf kapital').regex(/[0-9]/, 'Harus ada minimal 1 angka');
function validateParentPassword(password) {
    parentPasswordSchema.parse(password);
}
}),
"[project]/src/lib/otp.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createOtp",
    ()=>createOtp,
    "generateOtpCode",
    ()=>generateOtpCode,
    "generateResetToken",
    ()=>generateResetToken,
    "markOtpUsedAndCreateResetToken",
    ()=>markOtpUsedAndCreateResetToken,
    "validateResetToken",
    ()=>validateResetToken,
    "verifyOtp",
    ()=>verifyOtp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 60;
function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function generateResetToken() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString('hex');
}
async function createOtp(rawPhone, purpose) {
    const phone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(rawPhone);
    // Cek apakah ada OTP yang baru saja dikirim (cooldown)
    const cooldownCutoff = new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000);
    const recent = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.findFirst({
        where: {
            phone,
            purpose,
            createdAt: {
                gte: cooldownCutoff
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    if (recent) {
        const waitSec = Math.ceil(OTP_COOLDOWN_SECONDS - (Date.now() - recent.createdAt.getTime()) / 1000);
        throw new Error(`COOLDOWN:${waitSec}`);
    }
    // Batalkan OTP lama yang belum dipakai
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.updateMany({
        where: {
            phone,
            purpose,
            usedAt: null,
            expiresAt: {
                gt: new Date()
            }
        },
        data: {
            expiresAt: new Date()
        }
    });
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.create({
        data: {
            phone,
            code,
            purpose,
            expiresAt
        }
    });
    return {
        code,
        alreadySentRecently: false
    };
}
async function verifyOtp(rawPhone, code, purpose) {
    const phone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(rawPhone);
    const otp = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.findFirst({
        where: {
            phone,
            purpose,
            usedAt: null,
            expiresAt: {
                gt: new Date()
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    if (!otp) throw new Error('OTP tidak ditemukan atau sudah kedaluwarsa.');
    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
        throw new Error('Terlalu banyak percobaan. Minta OTP baru.');
    }
    if (otp.code !== code) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.update({
            where: {
                id: otp.id
            },
            data: {
                attempts: {
                    increment: 1
                }
            }
        });
        const remaining = MAX_OTP_ATTEMPTS - otp.attempts - 1;
        throw new Error(`Kode OTP salah. Sisa ${remaining} percobaan.`);
    }
    return {
        otpId: otp.id
    };
}
async function markOtpUsedAndCreateResetToken(otpId) {
    const resetToken = generateResetToken();
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.update({
        where: {
            id: otpId
        },
        data: {
            usedAt: new Date(),
            resetToken
        }
    });
    return resetToken;
}
async function validateResetToken(token) {
    const otp = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.findUnique({
        where: {
            resetToken: token
        }
    });
    if (!otp || !otp.usedAt) throw new Error('Token reset tidak valid.');
    const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000;
    if (Date.now() - otp.usedAt.getTime() > RESET_TOKEN_EXPIRY_MS) {
        throw new Error('Token reset sudah kedaluwarsa. Ulangi proses lupa password.');
    }
    return otp.phone;
}
}),
"[project]/src/actions/auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00ab03a76b17041564ee4451a4bad4539a1e719e62":{"name":"logoutAction"},"4005addc294dcba0fde1887d932f24788cf5f83b20":{"name":"loginSuperAdmin"},"4023a3669803dd8a3e0730b360d510e70397868b18":{"name":"verifyForgotPasswordOtp"},"4048280aa37e67636a6420adb9323c0c6eb3c81e53":{"name":"loginChild"},"406898bd8046d0af64cf5f0dbf5f37efa9fc3cc8f1":{"name":"registerFamilySpace"},"4078cf8e613daf247ef7169c45009ccca59e7a6b06":{"name":"resetPasswordWithToken"},"407e60aa3af09fa51d07fe50a9ff3d7b827bb311cb":{"name":"sendForgotPasswordOtp"},"4097a76d942a1a0833788884fc6760814ecb784f50":{"name":"loginParent"},"60b87a04293337bf8503af1e3e0c1b9fe6e7a84bfb":{"name":"updateUserEmail"},"60f1b8efbc215a116f8269426a6cbf12bd0c7249c8":{"name":"sendChangePhoneOtp"},"703f0ca2a9e5c94d9b35c8eeae35678f1993471821":{"name":"changePassword"},"70702eaa5fe1287bf9f97cd2fb9426d5150003d865":{"name":"verifyAndChangePhone"}},"src/actions/auth.ts",""] */ __turbopack_context__.s([
    "changePassword",
    ()=>changePassword,
    "loginChild",
    ()=>loginChild,
    "loginParent",
    ()=>loginParent,
    "loginSuperAdmin",
    ()=>loginSuperAdmin,
    "logoutAction",
    ()=>logoutAction,
    "registerFamilySpace",
    ()=>registerFamilySpace,
    "resetPasswordWithToken",
    ()=>resetPasswordWithToken,
    "sendChangePhoneOtp",
    ()=>sendChangePhoneOtp,
    "sendForgotPasswordOtp",
    ()=>sendForgotPasswordOtp,
    "updateUserEmail",
    ()=>updateUserEmail,
    "verifyAndChangePhone",
    ()=>verifyAndChangePhone,
    "verifyForgotPasswordOtp",
    ()=>verifyForgotPasswordOtp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$passwordPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/passwordPolicy.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/whatsapp.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/otp.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
// ─── Helpers ─────────────────────────────────────────────
async function generateUniqueSpaceCode() {
    for(let i = 0; i < 10; i++){
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].familySpace.findUnique({
            where: {
                spaceCode: code
            }
        });
        if (!existing) return code;
    }
    throw new Error('Gagal generate kode unik. Coba lagi.');
}
// ─── [1.5] Register FamilySpace ───────────────────────────
const registerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ownerName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Nama minimal 2 karakter'),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, 'Nomor WhatsApp tidak valid'),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, 'Password minimal 8 karakter'),
    familyName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Nama keluarga minimal 2 karakter')
});
async function registerFamilySpace(formData) {
    const parsed = registerSchema.safeParse({
        ownerName: formData.get('ownerName'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        familyName: formData.get('familyName')
    });
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid'
        };
    }
    const { ownerName, phone, password, familyName } = parsed.data;
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validatePhone"])(phone)) {
        return {
            success: false,
            error: 'Format nomor WhatsApp tidak valid.'
        };
    }
    const normalizedPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(phone);
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$passwordPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateParentPassword"])(password);
    } catch (err) {
        return {
            success: false,
            error: err?.errors?.[0]?.message ?? err?.message ?? 'Password tidak memenuhi syarat.'
        };
    }
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            phone: normalizedPhone
        }
    });
    if (existing) {
        return {
            success: false,
            error: 'Nomor WhatsApp sudah terdaftar.'
        };
    }
    const [passwordHash, spaceCode, starterPlan] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash(password, 12),
        generateUniqueSpaceCode(),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].plan.findFirst({
            where: {
                type: 'STARTER'
            }
        })
    ]);
    if (!starterPlan) {
        return {
            success: false,
            error: 'Konfigurasi plan belum siap. Hubungi admin.'
        };
    }
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            const owner = await tx.user.create({
                data: {
                    name: ownerName,
                    phone: normalizedPhone,
                    passwordHash,
                    role: 'PARENT'
                }
            });
            const familySpace = await tx.familySpace.create({
                data: {
                    name: familyName,
                    spaceCode,
                    ownerId: owner.id,
                    users: {
                        connect: {
                            id: owner.id
                        }
                    }
                }
            });
            await tx.user.update({
                where: {
                    id: owner.id
                },
                data: {
                    familySpaceId: familySpace.id
                }
            });
            const hundredYearsLater = new Date();
            hundredYearsLater.setFullYear(hundredYearsLater.getFullYear() + 100);
            await tx.subscription.create({
                data: {
                    familySpaceId: familySpace.id,
                    planId: starterPlan.id,
                    status: 'FREE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: hundredYearsLater
                }
            });
        });
        return {
            success: true,
            data: {
                spaceCode
            }
        };
    } catch (err) {
        console.error('[registerFamilySpace]', err);
        return {
            success: false,
            error: 'Terjadi kesalahan. Silakan coba lagi.'
        };
    }
}
async function loginParent(formData) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signIn"])('parent-credentials', {
            phone: formData.get('phone'),
            password: formData.get('password'),
            redirect: false
        });
        return {
            success: true,
            data: null
        };
    } catch (err) {
        const msg = err?.message ?? '';
        if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('RATE_LIMITED')) {
            return {
                success: false,
                error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
            };
        }
        return {
            success: false,
            error: 'Nomor WhatsApp atau password salah.'
        };
    }
}
async function loginChild(formData) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signIn"])('child-credentials', {
            spaceCode: formData.get('spaceCode'),
            username: formData.get('username'),
            password: formData.get('password'),
            redirect: false
        });
        return {
            success: true,
            data: null
        };
    } catch (err) {
        const msg = err?.message ?? '';
        if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('RATE_LIMITED')) {
            return {
                success: false,
                error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
            };
        }
        return {
            success: false,
            error: 'Kode keluarga, username, atau password salah.'
        };
    }
}
async function loginSuperAdmin(formData) {
    const email = formData.get('email')?.toString().trim() ?? '';
    const password = formData.get('password')?.toString() ?? '';
    if (!email || !password) {
        return {
            success: false,
            error: 'Email dan password wajib diisi.'
        };
    }
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            email
        }
    }).catch(()=>null);
    if (!user || user.role !== 'SUPER_ADMIN') {
        const ip = '0.0.0.0';
        await __turbopack_context__.A("[project]/src/lib/auth/loginGuard.ts [app-rsc] (ecmascript, async loader)").then((m)=>m.recordLoginAttempt(email || 'unknown', ip, false).catch(()=>{}));
        return {
            success: false,
            error: 'Email atau password salah.'
        };
    }
    // SuperAdmin login: masukkan email sebagai "phone" field di credentials
    // (auth config handles email fallback via OR query)
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signIn"])('parent-credentials', {
            phone: email,
            password,
            redirect: false
        });
        return {
            success: true,
            data: null
        };
    } catch (err) {
        const msg = err?.message ?? '';
        if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('RATE_LIMITED')) {
            return {
                success: false,
                error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
            };
        }
        return {
            success: false,
            error: 'Email atau password salah.'
        };
    }
}
async function sendForgotPasswordOtp(formData) {
    const rawPhone = formData.get('phone')?.toString().trim() ?? '';
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validatePhone"])(rawPhone)) {
        return {
            success: false,
            error: 'Format nomor WhatsApp tidak valid.'
        };
    }
    const phone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(rawPhone);
    // Pastikan nomor terdaftar
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            phone
        }
    });
    if (!user) {
        // Kembalikan pesan generik — jangan bocorkan apakah nomor ada atau tidak
        return {
            success: true,
            data: {
                phone
            }
        };
    }
    try {
        const { code } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createOtp"])(phone, 'RESET_PASSWORD');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendWhatsAppOtp"])(phone, code);
        return {
            success: true,
            data: {
                phone
            }
        };
    } catch (err) {
        const msg = err?.message ?? '';
        if (msg.startsWith('COOLDOWN:')) {
            const secs = msg.split(':')[1];
            return {
                success: false,
                error: `Tunggu ${secs} detik sebelum minta OTP baru.`
            };
        }
        console.error('[sendForgotPasswordOtp]', err);
        return {
            success: false,
            error: 'Gagal mengirim OTP. Coba beberapa saat lagi.'
        };
    }
}
async function verifyForgotPasswordOtp(formData) {
    const phone = formData.get('phone')?.toString().trim() ?? '';
    const code = formData.get('code')?.toString().trim() ?? '';
    if (!phone || code.length !== 6) {
        return {
            success: false,
            error: 'Data tidak lengkap.'
        };
    }
    try {
        const { otpId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyOtp"])(phone, code, 'RESET_PASSWORD');
        const resetToken = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["markOtpUsedAndCreateResetToken"])(otpId);
        return {
            success: true,
            data: {
                resetToken
            }
        };
    } catch (err) {
        return {
            success: false,
            error: err?.message ?? 'Verifikasi gagal.'
        };
    }
}
// ─── Reset Password dengan token ─────────────────────────
const resetPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    resetToken: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, 'Password minimal 8 karakter')
});
async function resetPasswordWithToken(formData) {
    const parsed = resetPasswordSchema.safeParse({
        resetToken: formData.get('resetToken'),
        password: formData.get('password')
    });
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid.'
        };
    }
    const { resetToken, password } = parsed.data;
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$passwordPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateParentPassword"])(password);
    } catch (err) {
        return {
            success: false,
            error: err?.errors?.[0]?.message ?? err?.message ?? 'Password tidak memenuhi syarat.'
        };
    }
    try {
        const phone = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateResetToken"])(resetToken);
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
            where: {
                phone
            }
        });
        if (!user) return {
            success: false,
            error: 'Akun tidak ditemukan.'
        };
        const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash(password, 12);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id: user.id
            },
            data: {
                passwordHash
            }
        });
        return {
            success: true,
            data: null
        };
    } catch (err) {
        return {
            success: false,
            error: err?.message ?? 'Reset password gagal.'
        };
    }
}
async function sendChangePhoneOtp(userId, rawPhone) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validatePhone"])(rawPhone)) {
        return {
            success: false,
            error: 'Format nomor WhatsApp tidak valid.'
        };
    }
    const newPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(rawPhone);
    // Pastikan nomor belum dipakai akun lain
    const conflict = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            phone: newPhone
        }
    });
    if (conflict && conflict.id !== userId) {
        return {
            success: false,
            error: 'Nomor WhatsApp ini sudah digunakan akun lain.'
        };
    }
    // Pastikan bukan nomor yang sama
    const me = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        },
        select: {
            phone: true
        }
    });
    if (me?.phone === newPhone) {
        return {
            success: false,
            error: 'Nomor baru sama dengan nomor saat ini.'
        };
    }
    try {
        const { code } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createOtp"])(newPhone, 'VERIFY_PHONE');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendWhatsAppOtp"])(newPhone, code);
        return {
            success: true,
            data: {
                phone: newPhone
            }
        };
    } catch (err) {
        const msg = err?.message ?? '';
        if (msg.startsWith('COOLDOWN:')) {
            const secs = msg.split(':')[1];
            return {
                success: false,
                error: `Tunggu ${secs} detik sebelum minta OTP baru.`
            };
        }
        console.error('[sendChangePhoneOtp]', err);
        return {
            success: false,
            error: 'Gagal mengirim OTP. Coba beberapa saat lagi.'
        };
    }
}
async function verifyAndChangePhone(userId, newPhone, code) {
    if (!newPhone || code.length !== 6) {
        return {
            success: false,
            error: 'Data tidak lengkap.'
        };
    }
    const normalizedPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(newPhone);
    // Periksa sekali lagi apakah ada konflik (bisa saja ada race condition)
    const conflict = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            phone: normalizedPhone
        }
    });
    if (conflict && conflict.id !== userId) {
        return {
            success: false,
            error: 'Nomor ini sudah dipakai akun lain.'
        };
    }
    try {
        const { otpId } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyOtp"])(normalizedPhone, code, 'VERIFY_PHONE');
        // Tandai OTP sebagai terpakai
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpCode.update({
            where: {
                id: otpId
            },
            data: {
                usedAt: new Date()
            }
        });
        // Update nomor di DB
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                phone: normalizedPhone
            }
        });
        return {
            success: true,
            data: {
                newPhone: normalizedPhone
            }
        };
    } catch (err) {
        return {
            success: false,
            error: err?.message ?? 'Verifikasi gagal.'
        };
    }
}
async function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
        return {
            success: false,
            error: 'Semua field wajib diisi.'
        };
    }
    // Ambil hash password lama
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        },
        select: {
            passwordHash: true
        }
    });
    if (!user) return {
        success: false,
        error: 'Akun tidak ditemukan.'
    };
    // Verifikasi password lama
    const isMatch = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].compare(currentPassword, user.passwordHash);
    if (!isMatch) {
        return {
            success: false,
            error: 'Password saat ini tidak sesuai.'
        };
    }
    // Pastikan password baru tidak sama dengan lama
    const isSame = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].compare(newPassword, user.passwordHash);
    if (isSame) {
        return {
            success: false,
            error: 'Password baru tidak boleh sama dengan password saat ini.'
        };
    }
    // Validasi kekuatan password baru
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$passwordPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateParentPassword"])(newPassword);
    } catch (err) {
        return {
            success: false,
            error: err?.errors?.[0]?.message ?? err?.message ?? 'Password tidak memenuhi syarat.'
        };
    }
    // Simpan hash baru
    const newHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash(newPassword, 12);
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
        where: {
            id: userId
        },
        data: {
            passwordHash: newHash
        }
    });
    return {
        success: true,
        data: null
    };
}
async function updateUserEmail(userId, email) {
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email('Format email tidak valid').safeParse(email.trim());
    if (!parsed.success) {
        return {
            success: false,
            error: 'Format email tidak valid.'
        };
    }
    const normalized = parsed.data.toLowerCase();
    try {
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
            where: {
                email: normalized
            }
        });
        if (existing && existing.id !== userId) {
            return {
                success: false,
                error: 'Email sudah digunakan akun lain.'
            };
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                email: normalized
            }
        });
        return {
            success: true,
            data: null
        };
    } catch (err) {
        return {
            success: false,
            error: 'Gagal menyimpan email.'
        };
    }
}
async function logoutAction() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["signOut"])({
        redirectTo: '/login'
    });
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    registerFamilySpace,
    loginParent,
    loginChild,
    loginSuperAdmin,
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPasswordWithToken,
    sendChangePhoneOtp,
    verifyAndChangePhone,
    changePassword,
    updateUserEmail,
    logoutAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(registerFamilySpace, "406898bd8046d0af64cf5f0dbf5f37efa9fc3cc8f1", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(loginParent, "4097a76d942a1a0833788884fc6760814ecb784f50", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(loginChild, "4048280aa37e67636a6420adb9323c0c6eb3c81e53", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(loginSuperAdmin, "4005addc294dcba0fde1887d932f24788cf5f83b20", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(sendForgotPasswordOtp, "407e60aa3af09fa51d07fe50a9ff3d7b827bb311cb", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyForgotPasswordOtp, "4023a3669803dd8a3e0730b360d510e70397868b18", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(resetPasswordWithToken, "4078cf8e613daf247ef7169c45009ccca59e7a6b06", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(sendChangePhoneOtp, "60f1b8efbc215a116f8269426a6cbf12bd0c7249c8", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyAndChangePhone, "70702eaa5fe1287bf9f97cd2fb9426d5150003d865", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(changePassword, "703f0ca2a9e5c94d9b35c8eeae35678f1993471821", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateUserEmail, "60b87a04293337bf8503af1e3e0c1b9fe6e7a84bfb", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(logoutAction, "00ab03a76b17041564ee4451a4bad4539a1e719e62", null);
}),
"[project]/.next-internal/server/app/(auth)/login/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/auth.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/auth.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/.next-internal/server/app/(auth)/login/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/auth.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "4048280aa37e67636a6420adb9323c0c6eb3c81e53",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginChild"],
    "4097a76d942a1a0833788884fc6760814ecb784f50",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginParent"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$auth$292f$login$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(auth)/login/page/actions.js { ACTIONS_MODULE0 => "[project]/src/actions/auth.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/auth.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__04nn2tq._.js.map