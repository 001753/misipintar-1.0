(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/_1s0wgnu._.js",
"[project]/src/instrumentation.ts [instrumentation-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Next.js Instrumentation — runs once on server startup.
 * Bootstraps BullMQ background workers and registers recurring cron jobs.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */ __turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    // Jangan jalankan workers saat build phase — mencegah SIGSEGV di cPanel
    // karena BullMQ/Firebase mendaftarkan signal handler di worker process next build.
    // NEXT_BUILD=1 di-set secara eksplisit di npm run build (lebih andal dari NEXT_PHASE
    // yang tidak selalu di-inject ke subprocess worker oleh Next.js 16).
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_BUILD === '1') return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
}),
"[project]/node_modules/next/dist/esm/build/templates/edge-wrapper.js { MODULE => \"[project]/src/instrumentation.ts [instrumentation-edge] (ecmascript)\" } [instrumentation-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {

// The wrapped module could be an async module, we handle that with the proxy
// here. The comma expression makes sure we don't call the function with the
// module as the "this" arg.
// Turn exports into functions that are also a thenable. This way you can await the whole object
// or  exports (e.g. for Components) or call them directly as though they are async functions
// (e.g. edge functions/middleware, this is what the Edge Runtime does).
// Catch promise to prevent UnhandledPromiseRejectionWarning, this will be propagated through
// the awaited export(s) anyway.
self._ENTRIES ||= {};
const modProm = Promise.resolve().then(()=>__turbopack_context__.i("[project]/src/instrumentation.ts [instrumentation-edge] (ecmascript)"));
modProm.catch(()=>{});
self._ENTRIES["middleware_instrumentation"] = new Proxy(modProm, {
    get (innerModProm, name) {
        if (name === 'then') {
            return (res, rej)=>innerModProm.then(res, rej);
        }
        let result = (...args)=>innerModProm.then((mod)=>(0, mod[name])(...args));
        result.then = (res, rej)=>innerModProm.then((mod)=>mod[name]).then(res, rej);
        return result;
    }
});
}),
]);

//# sourceMappingURL=_1s0wgnu._.js.map