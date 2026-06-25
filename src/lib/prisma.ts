import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Lazy singleton via Proxy — PrismaClient hanya diinisialisasi ketika ada
// akses pertama (misal prisma.user.findMany()), BUKAN saat modul di-import.
//
// Root cause SIGSEGV di cPanel:
//   next build worker (worker_thread) meng-import halaman yang transitif
//   mengimpor @/lib/auth/config -> @/lib/prisma -> new PrismaClient() ->
//   libquery_engine.node ter-load sebagai native addon di worker_thread ->
//   thread-safety violation -> SIGSEGV.
//
// Dengan Proxy ini, import @/lib/prisma tidak menginisialisasi engine.
// Engine baru ter-load saat query pertama di server runtime.
let _instance: PrismaClient | undefined

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    if (!_instance) {
      _instance = globalForPrisma.prisma ?? createPrismaClient()
      globalForPrisma.prisma = _instance
    }
    return Reflect.get(_instance, prop, _instance)
  },
})
