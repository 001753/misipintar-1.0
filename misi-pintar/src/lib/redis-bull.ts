/**
 * Shared BullMQ connection helper.
 * Parses REDIS_URL (ioredis format) into BullMQ connection config object.
 * Returns null if REDIS_URL is not set — callers must handle gracefully.
 */
export function getBullConnection(): {
  host: string
  port: number
  password?: string
  username?: string
  tls?: object
} | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    }
  } catch {
    return null
  }
}
