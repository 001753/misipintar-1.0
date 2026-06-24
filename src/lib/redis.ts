import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis | undefined {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('[redis] REDIS_URL not set — rate limiting disabled')
    return undefined
  }
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
  })
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
