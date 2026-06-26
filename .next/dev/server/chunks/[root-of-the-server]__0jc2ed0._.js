module.exports = [
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
"[externals]/ioredis [external] (ioredis, cjs, [project]/node_modules/ioredis)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("ioredis-23a6225d3f8c0bff", () => require("ioredis-23a6225d3f8c0bff"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0jc2ed0._.js.map