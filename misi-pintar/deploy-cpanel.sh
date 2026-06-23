#!/bin/bash
# ─────────────────────────────────────────────────────────────
# MISI PINTAR — Deploy Script untuk cPanel / Shared Hosting
# Jalankan di server setelah upload source code
# ─────────────────────────────────────────────────────────────

set -e

echo "📦 [1/6] Install dependencies..."
npm ci --omit=dev

echo "🔧 [2/6] Generate Prisma Client..."
npx prisma generate

echo "🗄️  [3/6] Jalankan database migrations..."
npx prisma migrate deploy

echo "🌱 [4/6] Seed data awal (Plans + SuperAdmin)..."
npx prisma db seed

echo "🏗️  [5/6] Build Next.js (standalone)..."
npm run build

echo "📂 [6/6] Copy static assets ke standalone output..."
cp -r public .next/standalone/misi-pintar/public 2>/dev/null || true
cp -r .next/static .next/standalone/misi-pintar/.next/static 2>/dev/null || true

echo ""
echo "✅ Build selesai!"
echo ""
echo "📋 Langkah selanjutnya di cPanel:"
echo "   1. Buka cPanel → Node.js App → Restart Application"
echo "   2. Pastikan .env sudah diisi dengan benar"
echo "   3. Application startup file: server.js"
echo "   4. Akses aplikasi di domain Anda"
echo ""
echo "⚠️  PENTING: Hapus SEED_ADMIN_PASSWORD dari .env setelah seeding selesai!"
