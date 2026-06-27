module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/package.json.[json].cjs [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "name": "misi-pintar",
    "version": "0.1.0",
    "private": true,
    "scripts": {
        "dev": "next dev --port 5000",
        "build": "NODE_ENV=production NEXT_BUILD=1 NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 TOKIO_WORKER_THREADS=1 UV_THREADPOOL_SIZE=1 next build --webpack",
        "build:debug": "node -e \"require('fs').writeFileSync('.build-debug.log','')\" && NEXT_BUILD=1 NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 TOKIO_WORKER_THREADS=1 UV_THREADPOOL_SIZE=1 NODE_OPTIONS='--require ./scripts/build-debug.cjs' next build --webpack",
        "build:prod": "NODE_ENV=production ./node_modules/.bin/prisma generate && NODE_ENV=production ./node_modules/.bin/prisma migrate deploy && NODE_ENV=production NEXT_BUILD=1 NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 TOKIO_WORKER_THREADS=1 UV_THREADPOOL_SIZE=1 next build --webpack",
        "build:cpanel": "bash scripts/cpanel-install.sh && NODE_ENV=production NEXT_BUILD=1 NEXT_TELEMETRY_DISABLED=1 RAYON_NUM_THREADS=1 TOKIO_WORKER_THREADS=1 UV_THREADPOOL_SIZE=1 next build --webpack && bash scripts/prepare-standalone.sh",
        "prepare:standalone": "bash scripts/prepare-standalone.sh",
        "start": "next start --port 5000",
        "lint": "eslint",
        "test": "vitest run --reporter=verbose",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage",
        "db:generate": "./node_modules/.bin/prisma generate",
        "db:migrate": "./node_modules/.bin/prisma migrate dev",
        "db:push": "./node_modules/.bin/prisma db push",
        "db:deploy": "./node_modules/.bin/prisma migrate deploy",
        "db:studio": "./node_modules/.bin/prisma studio",
        "db:seed": "./node_modules/.bin/prisma db seed",
        "deploy": "bash deploy.sh",
        "deploy:branch": "bash deploy.sh"
    },
    "dependencies": {
        "@aws-sdk/client-s3": "^3.1075.0",
        "@prisma/adapter-pg": "^6.19.3",
        "@prisma/client": "^6.19.3",
        "@radix-ui/react-accordion": "^1.2.14",
        "@react-pdf/renderer": "^4.5.1",
        "@swc/helpers": "^0.5.23",
        "@tailwindcss/postcss": "^4.3.1",
        "@types/bcryptjs": "^2.4.6",
        "@types/node": "^20",
        "@types/nodemailer": "^8.0.1",
        "@types/pg": "^8.20.0",
        "@types/qrcode": "^1.5.6",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "bcryptjs": "^3.0.3",
        "bullmq": "^5.79.1",
        "clsx": "^2.1.1",
        "date-fns": "^4.4.0",
        "dotenv": "^17.4.2",
        "firebase-admin": "^13.10.0",
        "framer-motion": "^12.42.0",
        "ioredis": "^5.11.1",
        "lucide-react": "^1.21.0",
        "midtrans-client": "^1.4.3",
        "nanoid": "^5.1.16",
        "next": "^16.2.9",
        "next-auth": "^5.0.0-beta.31",
        "next-nprogress-bar": "^2.4.7",
        "nodemailer": "^7.0.13",
        "pg": "^8.22.0",
        "preact": "^10.29.3",
        "prisma": "^6.19.3",
        "qrcode": "^1.5.4",
        "react": "^19.2.7",
        "react-countup": "^6.5.3",
        "react-dom": "^19.2.7",
        "react-intersection-observer": "^10.0.3",
        "recharts": "^3.9.0",
        "tailwind-merge": "^3.6.0",
        "tailwindcss": "^4.3.1",
        "tsx": "^4.22.4",
        "typescript": "^5.9.3",
        "zod": "^4.4.3"
    },
    "prisma": {
        "seed": "tsx prisma/seed.ts"
    },
    "devDependencies": {
        "@testing-library/jest-dom": "^6.9.1",
        "@testing-library/react": "^16.3.2",
        "@vitejs/plugin-react": "^6.0.2",
        "eslint": "^9",
        "eslint-config-next": "16.2.9",
        "jsdom": "^29.1.1",
        "vitest": "^4.1.9"
    }
};
}),
"[project]/src/app/api/health/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor(seconds % 86400 / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
}
async function GET() {
    const start = Date.now();
    const checks = {};
    // ── Database check ──────────────────────────────────────────────────────────
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].$queryRaw`SELECT 1`;
        checks.database = {
            status: 'ok',
            latencyMs: Date.now() - start
        };
    } catch (err) {
        checks.database = {
            status: 'error',
            detail: err instanceof Error ? err.message : String(err)
        };
    }
    // ── Plan seeding check — STARTER plan harus ada ───────────────────────────
    if (checks.database?.status === 'ok') {
        try {
            const starterPlan = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].plan.findFirst({
                where: {
                    type: 'STARTER'
                }
            });
            checks.starterPlan = starterPlan ? {
                status: 'ok',
                detail: `id: ${starterPlan.id}`
            } : {
                status: 'error',
                detail: 'Plan STARTER tidak ditemukan — jalankan: npm run db:seed'
            };
        } catch (err) {
            checks.starterPlan = {
                status: 'error',
                detail: err instanceof Error ? err.message : String(err)
            };
        }
    }
    // ── Env vars critical check ────────────────────────────────────────────────
    const requiredEnvs = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'SESSION_SECRET'
    ];
    const missingEnvs = requiredEnvs.filter((k)=>!process.env[k]);
    checks.envVars = missingEnvs.length === 0 ? {
        status: 'ok',
        detail: 'Semua env var kritis tersedia'
    } : {
        status: 'error',
        detail: `Missing: ${missingEnvs.join(', ')}`
    };
    // ── Redis check (opsional — tidak gagal jika tidak ada) ────────────────────
    try {
        const { redis } = await __turbopack_context__.A("[project]/src/lib/redis.ts [app-route] (ecmascript, async loader)");
        if (redis) {
            const redisStart = Date.now();
            await redis.ping();
            checks.redis = {
                status: 'ok',
                latencyMs: Date.now() - redisStart
            };
        } else {
            checks.redis = {
                status: 'ok',
                detail: 'disabled (REDIS_URL not set)'
            };
        }
    } catch (err) {
        checks.redis = {
            status: 'error',
            detail: err instanceof Error ? err.message : String(err)
        };
    }
    // ── Memory usage ────────────────────────────────────────────────────────────
    const mem = process.memoryUsage();
    const memory = {
        rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(mem.external / 1024 / 1024)} MB`
    };
    // ── App version dari package.json ──────────────────────────────────────────
    let appVersion = 'unknown';
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pkg = __turbopack_context__.r("[project]/package.json.[json].cjs [app-route] (ecmascript)");
        appVersion = pkg.version ?? 'unknown';
    } catch  {
    // tidak kritis
    }
    const allOk = Object.values(checks).every((c)=>c.status === 'ok');
    const totalMs = Date.now() - start;
    const body = {
        status: allOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(process.uptime()),
            human: formatUptime(process.uptime())
        },
        totalMs,
        checks,
        system: {
            node: process.version,
            pid: process.pid,
            memory,
            env: ("TURBOPACK compile-time value", "development") ?? 'unknown'
        },
        app: {
            name: 'misi-pintar',
            version: appVersion
        }
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(body, {
        status: allOk ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store'
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__07wf_t4._.js.map