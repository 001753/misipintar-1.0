import type { default as Redis, RedisOptions } from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis | undefined {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('[redis] REDIS_URL not set — rate limiting disabled')
    return undefined
  }

  // require() lazy — ioredis (dan @msgpackr-extract native binary-nya) HANYA
  // dimuat saat REDIS_URL tersedia dan client pertama kali dibutuhkan.
  // Static `import Redis from 'ioredis'` di baris pertama menyebabkan build
  // worker Next.js memuat native binary ini bahkan saat Redis tidak dipakai,
  // yang memicu crash di environment dengan ulimit ketat (cPanel shared hosting).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const IRedis = (require('ioredis') as { default: typeof Redis }).default
  const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
  }
  return new IRedis(url, options)
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
