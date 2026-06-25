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

import type { PrismaClient as PrismaClientType } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

function createPrismaClient(): PrismaClientType {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

let _instance: PrismaClientType | undefined

export const prisma: PrismaClientType = new Proxy({} as PrismaClientType, {
  get(_, prop: string | symbol) {
    if (!_instance) {
      _instance = globalForPrisma.prisma ?? createPrismaClient()
      globalForPrisma.prisma = _instance
    }
    return Reflect.get(_instance, prop, _instance)
  },
})
