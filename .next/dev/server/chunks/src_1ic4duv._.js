module.exports = [
"[project]/src/lib/redis.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[root-of-the-server]__104tk3u._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/lib/redis.ts [app-route] (ecmascript)");
    });
});
}),
"[project]/src/app/api/health/route.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/src/app/api/health/route.ts [app-route] (ecmascript)");
    });
});
}),
];