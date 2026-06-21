/**
 * [5.4] useFcmToken — Request permission + register FCM token.
 *
 * Gunakan di root layout atau halaman setelah login.
 * Membutuhkan NEXT_PUBLIC_FIREBASE_* env variables di client.
 */

"use client";

import { useEffect, useRef } from "react";

// Firebase config dari env (NEXT_PUBLIC_ agar aman di client)
const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFcmToken() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;

    // Periksa kelengkapan env
    if (!FIREBASE_CONFIG.apiKey || !VAPID_KEY) {
      // Firebase belum dikonfigurasi — skip silently
      return;
    }

    // Hanya jalan di browser yang mendukung Notification API
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    (async () => {
      try {
        // Minta izin notifikasi
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // Lazy-load Firebase untuk menghindari bundle size besar
        const { initializeApp, getApps } = await import("firebase/app");
        const { getMessaging, getToken } = await import("firebase/messaging");

        const app =
          getApps().length > 0
            ? getApps()[0]
            : initializeApp(FIREBASE_CONFIG);

        const messaging = getMessaging(app);

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;

        // Register token ke server
        await fetch("/api/fcm/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        registered.current = true;
      } catch (err) {
        // Gagal register tidak boleh crash UI
        console.warn("[FCM] Token registration failed:", err);
      }
    })();
  }, []);
}
