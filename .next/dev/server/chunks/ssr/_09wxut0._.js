module.exports = [
"[project]/src/actions/children.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4021b1812cefc9a33f00ca817035dcf7a1fcd4a434":{"name":"deleteChild"},"408385694cb1baef177aef767333ae44a276fcb149":{"name":"getPlanLimits"},"40b1c3039d2307cf6a7272067602ee4f03351d42c9":{"name":"createChild"},"40c51d5a2113f53f14d57b5e71c666f5bc35ba1bbb":{"name":"restoreChild"},"606a78422a0a6c0095f81bfa7299d43347bf1a5e18":{"name":"changeChildPassword"},"60d7b05b65e59b1309384193a2413538dc7e620db7":{"name":"updateChild"}},"src/actions/children.ts",""] */ __turbopack_context__.s([
    "changeChildPassword",
    ()=>changeChildPassword,
    "createChild",
    ()=>createChild,
    "deleteChild",
    ()=>deleteChild,
    "getPlanLimits",
    ()=>getPlanLimits,
    "restoreChild",
    ()=>restoreChild,
    "updateChild",
    ()=>updateChild
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$passwordPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/passwordPolicy.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
// ─── Helpers ─────────────────────────────────────────────
async function getParentSession() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session || session.user.role !== 'PARENT' || !session.user.familySpaceId) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/login');
    }
    return {
        familySpaceId: session.user.familySpaceId
    };
}
// Status yang dianggap aktif (berhak menikmati limit premium)
const ACTIVE_SUB_STATUSES = new Set([
    "TRIAL",
    "FREE",
    "PRO",
    "EDUCATOR",
    "SCHOOL"
]);
// Fallback ke limit FREE jika langganan EXPIRED/CANCELLED
const FREE_LIMITS = {
    maxChildren: 2,
    maxTasksPerMonth: 10
};
async function getPlanLimits(familySpaceId) {
    const sub = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].subscription.findUnique({
        where: {
            familySpaceId
        },
        include: {
            plan: true
        }
    });
    // Jika langganan expired atau dibatalkan, downgrade ke limit gratis
    if (!sub || !ACTIVE_SUB_STATUSES.has(sub.status)) return FREE_LIMITS;
    return sub.plan.limits ?? FREE_LIMITS;
}
// ─── Schemas ──────────────────────────────────────────────
const createChildSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Nama minimal 2 karakter').max(50),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, 'Username minimal 3 karakter').max(20).regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(6, 'Password minimal 6 karakter'),
    avatar: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
async function createChild(formData) {
    const { familySpaceId } = await getParentSession();
    const parsed = createChildSchema.safeParse({
        name: formData.get('name'),
        username: formData.get('username'),
        password: formData.get('password'),
        avatar: formData.get('avatar') || undefined
    });
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid'
        };
    }
    const { name, username, password, avatar } = parsed.data;
    // [7.3] Validasi password anak via passwordPolicy
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$passwordPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateChildPassword"])(password, username);
    } catch (err) {
        return {
            success: false,
            error: err?.message ?? 'Password tidak valid.'
        };
    }
    const limits = await getPlanLimits(familySpaceId);
    const maxChildren = limits.maxChildren ?? 2;
    const currentCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.count({
        where: {
            familySpaceId,
            deletedAt: null
        }
    });
    if (currentCount >= maxChildren) {
        return {
            success: false,
            error: `Paket Anda hanya mendukung ${maxChildren} anak. Upgrade plan untuk menambah lebih banyak.`
        };
    }
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
        where: {
            familySpaceId_username: {
                familySpaceId,
                username
            }
        }
    });
    if (existing && !existing.deletedAt) {
        return {
            success: false,
            error: 'Username sudah digunakan dalam keluarga ini.'
        };
    }
    const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash(password, 12);
    const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.create({
        data: {
            name,
            username,
            passwordHash,
            avatar: avatar ?? '🧒',
            familySpaceId
        }
    });
    return {
        success: true,
        data: {
            childId: child.id
        }
    };
}
async function updateChild(childId, formData) {
    const { familySpaceId } = await getParentSession();
    const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
        where: {
            id: childId
        }
    });
    if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
        return {
            success: false,
            error: 'Anak tidak ditemukan.'
        };
    }
    const name = formData.get('name')?.toString().trim();
    const avatar = formData.get('avatar')?.toString() || undefined;
    const usernameRaw = formData.get('username')?.toString().trim();
    const username = usernameRaw ? usernameRaw.toLowerCase().replace(/[^a-z0-9_]/g, '') : undefined;
    if (!name || name.length < 2) {
        return {
            success: false,
            error: 'Nama minimal 2 karakter.'
        };
    }
    if (username !== undefined) {
        if (username.length < 3) {
            return {
                success: false,
                error: 'Username minimal 3 karakter.'
            };
        }
        if (username !== child.username) {
            const conflict = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
                where: {
                    familySpaceId_username: {
                        familySpaceId,
                        username
                    }
                }
            });
            if (conflict && !conflict.deletedAt) {
                return {
                    success: false,
                    error: 'Username sudah digunakan dalam keluarga ini.'
                };
            }
        }
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.update({
        where: {
            id: childId
        },
        data: {
            name,
            avatar,
            ...username ? {
                username
            } : {}
        }
    });
    return {
        success: true,
        data: null
    };
}
async function changeChildPassword(childId, formData) {
    const { familySpaceId } = await getParentSession();
    const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
        where: {
            id: childId
        }
    });
    if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
        return {
            success: false,
            error: 'Anak tidak ditemukan.'
        };
    }
    const newPassword = formData.get('newPassword')?.toString() ?? '';
    // [7.3] Validasi password anak via passwordPolicy
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$passwordPolicy$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateChildPassword"])(newPassword, child.username);
    } catch (err) {
        return {
            success: false,
            error: err?.message ?? 'Password tidak valid.'
        };
    }
    const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].hash(newPassword, 12);
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.update({
        where: {
            id: childId
        },
        data: {
            passwordHash
        }
    });
    return {
        success: true,
        data: null
    };
}
async function deleteChild(childId) {
    const { familySpaceId } = await getParentSession();
    const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
        where: {
            id: childId
        }
    });
    if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
        return {
            success: false,
            error: 'Anak tidak ditemukan.'
        };
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.update({
        where: {
            id: childId
        },
        data: {
            deletedAt: new Date()
        }
    });
    return {
        success: true,
        data: null
    };
}
async function restoreChild(childId) {
    const { familySpaceId } = await getParentSession();
    const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
        where: {
            id: childId
        }
    });
    if (!child || child.familySpaceId !== familySpaceId || !child.deletedAt) {
        return {
            success: false,
            error: 'Anak tidak ditemukan atau sudah aktif.'
        };
    }
    // Cek limit plan sebelum restore
    const limits = await getPlanLimits(familySpaceId);
    const maxChildren = limits.maxChildren ?? 2;
    const activeCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.count({
        where: {
            familySpaceId,
            deletedAt: null
        }
    });
    if (maxChildren !== -1 && activeCount >= maxChildren) {
        return {
            success: false,
            error: `Batas ${maxChildren} anak aktif tercapai. Hapus atau upgrade plan terlebih dahulu.`
        };
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.update({
        where: {
            id: childId
        },
        data: {
            deletedAt: null
        }
    });
    return {
        success: true,
        data: null
    };
}
;
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getPlanLimits,
    createChild,
    updateChild,
    changeChildPassword,
    deleteChild,
    restoreChild
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getPlanLimits, "408385694cb1baef177aef767333ae44a276fcb149", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createChild, "40b1c3039d2307cf6a7272067602ee4f03351d42c9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateChild, "60d7b05b65e59b1309384193a2413538dc7e620db7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(changeChildPassword, "606a78422a0a6c0095f81bfa7299d43347bf1a5e18", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteChild, "4021b1812cefc9a33f00ca817035dcf7a1fcd4a434", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(restoreChild, "40c51d5a2113f53f14d57b5e71c666f5bc35ba1bbb", null);
}),
"[project]/src/lib/notifications/fcm.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
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
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].fcmToken.deleteMany({
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
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].fcmToken.findMany({
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
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].fcmToken.findMany({
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
"[project]/src/actions/tasks.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40556095de4fe34c846b30beecf6761350f6db2aa6":{"name":"createTask"},"40e7f57ea3a6a7beed9e5e7d40debc390d1f71fd2a":{"name":"approveTask"},"601b5f738c529c15db9b38d8e31936b2209f058816":{"name":"rejectTask"},"60daf858815d67c296f0281b7cb99083f4d535f255":{"name":"claimTask"}},"src/actions/tasks.ts",""] */ __turbopack_context__.s([
    "approveTask",
    ()=>approveTask,
    "claimTask",
    ()=>claimTask,
    "createTask",
    ()=>createTask,
    "rejectTask",
    ()=>rejectTask
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth/config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfMonth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/startOfMonth.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfMonth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/endOfMonth.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notifications/fcm.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$sse$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/notifications/sse.ts [app-rsc] (ecmascript)");
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
async function getParentSession() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session || session.user.role !== 'PARENT' || !session.user.familySpaceId) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/login');
    }
    return {
        familySpaceId: session.user.familySpaceId,
        userId: session.user.id
    };
}
async function getChildSession() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["auth"])();
    if (!session || session.user.role !== 'CHILD' || !session.user.childId || !session.user.familySpaceId) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])('/login');
    }
    return {
        childId: session.user.childId,
        familySpaceId: session.user.familySpaceId
    };
}
// Status yang dianggap aktif (berhak menikmati limit premium)
const ACTIVE_SUB_STATUSES = new Set([
    "TRIAL",
    "FREE",
    "PRO",
    "EDUCATOR",
    "SCHOOL"
]);
async function getMaxTasksPerMonth(familySpaceId) {
    const sub = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].subscription.findUnique({
        where: {
            familySpaceId
        },
        include: {
            plan: true
        }
    });
    // Jika langganan expired atau dibatalkan, kembali ke default gratis
    if (!sub || !ACTIVE_SUB_STATUSES.has(sub.status)) return 10;
    const limits = sub.plan.limits ?? {
        maxTasksPerMonth: 10
    };
    return limits.maxTasksPerMonth ?? 10;
}
// ─── [2.2a] createTask ───────────────────────────────────
const createTaskSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    childId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid('Child ID tidak valid'),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, 'Judul minimal 3 karakter').max(100),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional(),
    rewardAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().positive('Reward harus lebih dari 0')
});
async function createTask(formData) {
    const { familySpaceId } = await getParentSession();
    const parsed = createTaskSchema.safeParse({
        childId: formData.get('childId'),
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        rewardAmount: formData.get('rewardAmount')
    });
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Data tidak valid'
        };
    }
    const { childId, title, description, rewardAmount } = parsed.data;
    // Anti cross-tenant: pastikan child milik familySpace ini
    const child = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].child.findUnique({
        where: {
            id: childId
        }
    });
    if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
        return {
            success: false,
            error: 'Anak tidak ditemukan.'
        };
    }
    // Cek limit tugas bulan ini (real-time dari DB, bukan cache)
    const maxTasksPerMonth = await getMaxTasksPerMonth(familySpaceId);
    if (maxTasksPerMonth !== -1) {
        const now = new Date();
        const taskCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].task.count({
            where: {
                familySpaceId,
                createdAt: {
                    gte: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfMonth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["startOfMonth"])(now),
                    lte: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$endOfMonth$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["endOfMonth"])(now)
                }
            }
        });
        if (taskCount >= maxTasksPerMonth) {
            return {
                success: false,
                error: `Batas ${maxTasksPerMonth} tugas per bulan telah tercapai. Upgrade plan untuk membuat lebih banyak tugas.`
            };
        }
    }
    const task = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].task.create({
        data: {
            familySpaceId,
            childId,
            title,
            description,
            rewardAmount,
            status: 'PENDING'
        }
    });
    return {
        success: true,
        data: {
            taskId: task.id
        }
    };
}
async function claimTask(taskId, proofPhotoUrl) {
    const { childId, familySpaceId } = await getChildSession();
    const task = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].task.findUnique({
        where: {
            id: taskId
        }
    });
    // Validasi: task milik child ini dan familySpace ini
    if (!task || task.childId !== childId || task.familySpaceId !== familySpaceId) {
        return {
            success: false,
            error: 'Tugas tidak ditemukan.'
        };
    }
    if (task.status !== 'PENDING') {
        return {
            success: false,
            error: 'Tugas ini tidak bisa diklaim saat ini.'
        };
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].task.update({
        where: {
            id: taskId
        },
        data: {
            status: 'CLAIMED',
            claimedAt: new Date(),
            proofPhotoUrl: proofPhotoUrl ?? null
        }
    });
    // Notifikasi ke parent (non-fatal — gagal tidak membatalkan klaim)
    try {
        const familySpace = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].familySpace.findUnique({
            where: {
                id: familySpaceId
            },
            select: {
                ownerId: true,
                name: true
            }
        });
        const parentId = familySpace?.ownerId;
        if (parentId) {
            const notifTitle = 'Tugas Diklaim! 📋';
            const notifBody = `${task.title} sedang menunggu persetujuan Anda.`;
            // 1. Simpan ke DB Notification
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].notification.create({
                data: {
                    familySpaceId,
                    userId: parentId,
                    title: notifTitle,
                    body: notifBody,
                    type: 'TASK_CLAIMED'
                }
            });
            // 2. Increment unread badge counter di Redis
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$sse$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementUnreadBadge"])(parentId);
            // 3. SSE real-time ke parent dashboard
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$sse$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["publishToFamily"])(familySpaceId, {
                type: 'task_claimed',
                payload: {
                    taskId,
                    taskTitle: task.title
                }
            });
            // 4. FCM push ke perangkat parent
            const tokens = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getUserFcmTokens"])(parentId);
            if (tokens.length > 0) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendPushNotification"])(tokens, notifTitle, notifBody, {
                    type: 'TASK_CLAIMED',
                    taskId
                });
            }
        }
    } catch (err) {
        console.error('[claimTask] Notification error (non-fatal):', err);
    }
    return {
        success: true,
        data: null
    };
}
async function approveTask(taskId) {
    const { familySpaceId } = await getParentSession();
    const task = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].task.findUnique({
        where: {
            id: taskId
        },
        include: {
            child: true
        }
    });
    if (!task || task.familySpaceId !== familySpaceId) {
        return {
            success: false,
            error: 'Tugas tidak ditemukan.'
        };
    }
    if (task.status !== 'CLAIMED') {
        return {
            success: false,
            error: 'Hanya tugas yang sudah diklaim yang bisa disetujui.'
        };
    }
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        // 1. Update status tugas
        await tx.task.update({
            where: {
                id: taskId
            },
            data: {
                status: 'APPROVED',
                approvedAt: new Date()
            }
        });
        // 2. Baca saldo anak dalam transaksi yang sama (untuk konsistensi)
        const child = await tx.child.findUnique({
            where: {
                id: task.childId
            }
        });
        if (!child) throw new Error('Child not found in transaction');
        const balanceBefore = child.balance;
        const balanceAfter = balanceBefore + task.rewardAmount;
        // 3. Update saldo anak
        await tx.child.update({
            where: {
                id: task.childId
            },
            data: {
                balance: balanceAfter
            }
        });
        // 4. Buat baris TransactionLedger (IMMUTABLE — tidak ada delete/update)
        await tx.transactionLedger.create({
            data: {
                familySpaceId,
                childId: task.childId,
                type: 'TASK_REWARD',
                amount: task.rewardAmount,
                balanceBefore,
                balanceAfter,
                description: `Reward tugas: ${task.title}`,
                refId: taskId
            }
        });
        // 5. Notifikasi DB untuk child (tanpa userId karena child bukan User)
        await tx.notification.create({
            data: {
                familySpaceId,
                title: 'Tugas Disetujui! 🎉',
                body: `Kamu mendapat Rp ${task.rewardAmount.toLocaleString('id-ID')} dari tugas "${task.title}"`,
                type: 'TASK_APPROVED'
            }
        });
        return {
            balanceAfter,
            childId: task.childId
        };
    });
    // Non-fatal: FCM + SSE setelah transaksi selesai
    try {
        const notifTitle = 'Tugas Disetujui! 🎉';
        const notifBody = `Kamu mendapat Rp ${task.rewardAmount.toLocaleString('id-ID')} dari tugas "${task.title}"`;
        // SSE real-time (balance update ke parent dashboard)
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$sse$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["publishToFamily"])(familySpaceId, {
            type: 'task_approved',
            payload: {
                taskId,
                taskTitle: task.title,
                reward: task.rewardAmount,
                newBalance: result.balanceAfter,
                childId: result.childId
            }
        });
        // FCM ke perangkat child
        const childTokens = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getChildFcmTokens"])(result.childId);
        if (childTokens.length > 0) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendPushNotification"])(childTokens, notifTitle, notifBody, {
                type: 'TASK_APPROVED',
                taskId
            });
        }
    } catch (err) {
        console.error('[approveTask] Notification error (non-fatal):', err);
    }
    return {
        success: true,
        data: {
            newBalance: result.balanceAfter
        }
    };
}
async function rejectTask(taskId, reason) {
    const { familySpaceId } = await getParentSession();
    const task = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].task.findUnique({
        where: {
            id: taskId
        }
    });
    if (!task || task.familySpaceId !== familySpaceId) {
        return {
            success: false,
            error: 'Tugas tidak ditemukan.'
        };
    }
    if (task.status !== 'CLAIMED') {
        return {
            success: false,
            error: 'Hanya tugas yang sudah diklaim yang bisa ditolak.'
        };
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].task.update({
        where: {
            id: taskId
        },
        data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectedReason: reason.trim() || 'Tidak ada alasan.'
        }
    });
    // Non-fatal: Notifikasi DB + FCM ke child
    try {
        const notifTitle = 'Tugas Ditolak 😔';
        const notifBody = `Tugas "${task.title}" ditolak. Alasan: ${reason.trim() || 'Tidak ada alasan.'}`;
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].notification.create({
            data: {
                familySpaceId,
                title: notifTitle,
                body: notifBody,
                type: 'TASK_REJECTED'
            }
        });
        // FCM ke child
        const childTokens = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getChildFcmTokens"])(task.childId);
        if (childTokens.length > 0) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$notifications$2f$fcm$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendPushNotification"])(childTokens, notifTitle, notifBody, {
                type: 'TASK_REJECTED',
                taskId
            });
        }
    } catch (err) {
        console.error('[rejectTask] Notification error (non-fatal):', err);
    }
    return {
        success: true,
        data: null
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createTask,
    claimTask,
    approveTask,
    rejectTask
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createTask, "40556095de4fe34c846b30beecf6761350f6db2aa6", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(claimTask, "60daf858815d67c296f0281b7cb99083f4d535f255", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(approveTask, "40e7f57ea3a6a7beed9e5e7d40debc390d1f71fd2a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(rejectTask, "601b5f738c529c15db9b38d8e31936b2209f058816", null);
}),
"[project]/.next-internal/server/app/dashboard/onboarding/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/auth.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/actions/children.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/actions/tasks.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$children$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/children.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$tasks$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/tasks.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/.next-internal/server/app/dashboard/onboarding/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/actions/auth.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/actions/children.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/actions/tasks.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00586845366c86b1897679a21f388b262cd1f4a182",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logoutAction"],
    "400f5527bf27fb3a2a1a48f3727151678f0551a968",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyForgotPasswordOtp"],
    "40202c3e99524c97bdd1fb2bd66fa655b3904ff3f5",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginChild"],
    "403e4db224b1587b46746f3918192632a187b38e05",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendForgotPasswordOtp"],
    "40556095de4fe34c846b30beecf6761350f6db2aa6",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$tasks$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createTask"],
    "405b45cb4a8b0f14843830c1363d3a95bc511f82bc",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resetPasswordWithToken"],
    "4076f5c2dd41e6cc0f114b424931172f5ad8fd8f3a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginSuperAdmin"],
    "40b1c3039d2307cf6a7272067602ee4f03351d42c9",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$children$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createChild"],
    "40d8100a48fc8cafc81da2a3d44cf605e82888e216",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginParent"],
    "40e23fb14a42adbaee2ed568c316c80def4c3c5057",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerFamilySpace"],
    "604b7a4ed34e9dc666e6a5dcb4f2573f67aa4224ca",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateUserEmail"],
    "60c84dbaca3652720583cb2335cb56f7e834351cae",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendChangePhoneOtp"],
    "70116e6ebf4c0f31abf0136b0cbf44ea3e8bc8b3d0",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyAndChangePhone"],
    "7031f2b02abd07019258f65b846b1d5c22e2af6560",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["changePassword"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$dashboard$2f$onboarding$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$children$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$actions$2f$tasks$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/dashboard/onboarding/page/actions.js { ACTIONS_MODULE0 => "[project]/src/actions/auth.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/actions/children.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/src/actions/tasks.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$children$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/children.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$actions$2f$tasks$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/actions/tasks.ts [app-rsc] (ecmascript)");
}),
"[project]/node_modules/date-fns/constants.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * @module constants
 * @summary Useful constants
 * @description
 * Collection of useful date constants.
 *
 * The constants could be imported from `date-fns/constants`:
 *
 * ```ts
 * import { maxTime, minTime } from "./constants/date-fns/constants";
 *
 * function isAllowedTime(time) {
 *   return time <= maxTime && time >= minTime;
 * }
 * ```
 */ /**
 * @constant
 * @name daysInWeek
 * @summary Days in 1 week.
 */ __turbopack_context__.s([
    "constructFromSymbol",
    ()=>constructFromSymbol,
    "daysInWeek",
    ()=>daysInWeek,
    "daysInYear",
    ()=>daysInYear,
    "maxTime",
    ()=>maxTime,
    "millisecondsInDay",
    ()=>millisecondsInDay,
    "millisecondsInHour",
    ()=>millisecondsInHour,
    "millisecondsInMinute",
    ()=>millisecondsInMinute,
    "millisecondsInSecond",
    ()=>millisecondsInSecond,
    "millisecondsInWeek",
    ()=>millisecondsInWeek,
    "minTime",
    ()=>minTime,
    "minutesInDay",
    ()=>minutesInDay,
    "minutesInHour",
    ()=>minutesInHour,
    "minutesInMonth",
    ()=>minutesInMonth,
    "minutesInYear",
    ()=>minutesInYear,
    "monthsInQuarter",
    ()=>monthsInQuarter,
    "monthsInYear",
    ()=>monthsInYear,
    "quartersInYear",
    ()=>quartersInYear,
    "secondsInDay",
    ()=>secondsInDay,
    "secondsInHour",
    ()=>secondsInHour,
    "secondsInMinute",
    ()=>secondsInMinute,
    "secondsInMonth",
    ()=>secondsInMonth,
    "secondsInQuarter",
    ()=>secondsInQuarter,
    "secondsInWeek",
    ()=>secondsInWeek,
    "secondsInYear",
    ()=>secondsInYear
]);
const daysInWeek = 7;
const daysInYear = 365.2425;
const maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1000;
const minTime = -maxTime;
const millisecondsInWeek = 604800000;
const millisecondsInDay = 86400000;
const millisecondsInMinute = 60000;
const millisecondsInHour = 3600000;
const millisecondsInSecond = 1000;
const minutesInYear = 525600;
const minutesInMonth = 43200;
const minutesInDay = 1440;
const minutesInHour = 60;
const monthsInQuarter = 3;
const monthsInYear = 12;
const quartersInYear = 4;
const secondsInHour = 3600;
const secondsInMinute = 60;
const secondsInDay = secondsInHour * 24;
const secondsInWeek = secondsInDay * 7;
const secondsInYear = secondsInDay * daysInYear;
const secondsInMonth = secondsInYear / 12;
const secondsInQuarter = secondsInMonth * 3;
const constructFromSymbol = Symbol.for("constructDateFrom");
}),
"[project]/node_modules/date-fns/constructFrom.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "constructFrom",
    ()=>constructFrom,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/constants.js [app-rsc] (ecmascript)");
;
function constructFrom(date, value) {
    if (typeof date === "function") return date(value);
    if (date && typeof date === "object" && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["constructFromSymbol"] in date) return date[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constants$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["constructFromSymbol"]](value);
    if (date instanceof Date) return new date.constructor(value);
    return new Date(value);
}
const __TURBOPACK__default__export__ = constructFrom;
}),
"[project]/node_modules/date-fns/toDate.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "toDate",
    ()=>toDate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constructFrom$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/constructFrom.js [app-rsc] (ecmascript)");
;
function toDate(argument, context) {
    // [TODO] Get rid of `toDate` or `constructFrom`?
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$constructFrom$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["constructFrom"])(context || argument, argument);
}
const __TURBOPACK__default__export__ = toDate;
}),
"[project]/node_modules/date-fns/startOfMonth.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "startOfMonth",
    ()=>startOfMonth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$toDate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/toDate.js [app-rsc] (ecmascript)");
;
function startOfMonth(date, options) {
    const _date = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$toDate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["toDate"])(date, options?.in);
    _date.setDate(1);
    _date.setHours(0, 0, 0, 0);
    return _date;
}
const __TURBOPACK__default__export__ = startOfMonth;
}),
"[project]/node_modules/date-fns/endOfMonth.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "endOfMonth",
    ()=>endOfMonth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$toDate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/toDate.js [app-rsc] (ecmascript)");
;
function endOfMonth(date, options) {
    const _date = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$toDate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["toDate"])(date, options?.in);
    const month = _date.getMonth();
    _date.setFullYear(_date.getFullYear(), month + 1, 0);
    _date.setHours(23, 59, 59, 999);
    return _date;
}
const __TURBOPACK__default__export__ = endOfMonth;
}),
];

//# sourceMappingURL=_09wxut0._.js.map