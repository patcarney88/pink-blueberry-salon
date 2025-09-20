import { createClient, RedisClientType } from 'redis'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db?: number
  retryStrategy?: (times: number) => number | Error
  enableOfflineQueue?: boolean
  connectTimeout?: number
  maxRetriesPerRequest?: number
}

class RedisManager {
  private client: RedisClientType | null = null
  private subscriberClient: RedisClientType | null = null
  private publisherClient: RedisClientType | null = null
  private config: RedisConfig

  constructor() {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      enableOfflineQueue: false,
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 attempts')
          return new Error('Redis connection failed')
        }
        return Math.min(times * 100, 3000)
      },
    }
  }

  /**
   * Get or create the main Redis client
   */
  async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: this.config.connectTimeout,
        },
        password: this.config.password,
        database: this.config.db,
      })

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
      })

      this.client.on('connect', () => {
        console.log('Redis Client Connected')
      })

      this.client.on('ready', () => {
        console.log('Redis Client Ready')
      })

      await this.client.connect()
    }

    return this.client
  }

  /**
   * Get subscriber client for pub/sub
   */
  async getSubscriber(): Promise<RedisClientType> {
    if (!this.subscriberClient) {
      this.subscriberClient = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db,
      })

      await this.subscriberClient.connect()
    }

    return this.subscriberClient
  }

  /**
   * Get publisher client for pub/sub
   */
  async getPublisher(): Promise<RedisClientType> {
    if (!this.publisherClient) {
      this.publisherClient = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db,
      })

      await this.publisherClient.connect()
    }

    return this.publisherClient
  }

  /**
   * Disconnect all Redis clients
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
    }

    if (this.subscriberClient) {
      await this.subscriberClient.quit()
      this.subscriberClient = null
    }

    if (this.publisherClient) {
      await this.publisherClient.quit()
      this.publisherClient = null
    }
  }
}

// Create singleton instance
const redisManager = new RedisManager()

// Export a proxy that automatically gets the client
export const redis = new Proxy({} as RedisClientType, {
  get(target, prop) {
    return async (...args: any[]) => {
      const client = await redisManager.getClient()
      return (client as any)[prop](...args)
    }
  },
})

// Export manager for advanced usage
export { redisManager }

// Rate limiter using Redis
export class RedisRateLimiter {
  private keyPrefix = 'rate_limit:'

  /**
   * Check if request is allowed under rate limit
   */
  async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const client = await redisManager.getClient()
    const key = `${this.keyPrefix}${identifier}`
    const now = Date.now()
    const window = Math.floor(now / windowMs)
    const windowKey = `${key}:${window}`

    // Use Redis pipeline for atomic operations
    const multi = client.multi()
    multi.incr(windowKey)
    multi.expire(windowKey, Math.ceil(windowMs / 1000))

    const results = await multi.exec()
    const count = results?.[0] as number || 1

    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)
    const resetTime = (window + 1) * windowMs

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string, windowMs: number): Promise<void> {
    const client = await redisManager.getClient()
    const key = `${this.keyPrefix}${identifier}`
    const window = Math.floor(Date.now() / windowMs)
    const windowKey = `${key}:${window}`

    await client.del(windowKey)
  }

  /**
   * Get current usage for an identifier
   */
  async getUsage(
    identifier: string,
    windowMs: number
  ): Promise<number> {
    const client = await redisManager.getClient()
    const key = `${this.keyPrefix}${identifier}`
    const window = Math.floor(Date.now() / windowMs)
    const windowKey = `${key}:${window}`

    const count = await client.get(windowKey)
    return parseInt(count || '0')
  }
}

// Cache manager using Redis
export class RedisCacheManager {
  private defaultTTL = 3600 // 1 hour in seconds

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const client = await redisManager.getClient()
    const value = await client.get(key)

    if (!value) return null

    try {
      return JSON.parse(value) as T
    } catch {
      return value as any
    }
  }

  /**
   * Set value in cache
   */
  async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<void> {
    const client = await redisManager.getClient()
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    const ttl = ttlSeconds || this.defaultTTL

    await client.setEx(key, ttl, serialized)
  }

  /**
   * Delete value from cache
   */
  async del(key: string | string[]): Promise<void> {
    const client = await redisManager.getClient()
    const keys = Array.isArray(key) ? key : [key]

    if (keys.length > 0) {
      await client.del(keys)
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = await redisManager.getClient()
    const result = await client.exists(key)
    return result === 1
  }

  /**
   * Set value with expiry
   */
  async setex(
    key: string,
    seconds: number,
    value: any
  ): Promise<void> {
    await this.set(key, value, seconds)
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    const client = await redisManager.getClient()
    return await client.ttl(key)
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    const client = await redisManager.getClient()
    return await client.incr(key)
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    const client = await redisManager.getClient()
    return await client.decr(key)
  }

  /**
   * Clear all cache (use with caution)
   */
  async flush(): Promise<void> {
    const client = await redisManager.getClient()
    await client.flushDb()
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const client = await redisManager.getClient()
    return await client.keys(pattern)
  }

  /**
   * Cache with automatic refresh
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const fresh = await fetcher()

    // Store in cache
    await this.set(key, fresh, ttlSeconds)

    return fresh
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const client = await redisManager.getClient()
    const keys = await client.keys(pattern)

    if (keys.length > 0) {
      await client.del(keys)
    }

    return keys.length
  }
}

// Session store using Redis
export class RedisSessionStore {
  private prefix = 'session:'
  private defaultTTL = 86400 // 24 hours

  /**
   * Get session data
   */
  async get(sessionId: string): Promise<any | null> {
    const client = await redisManager.getClient()
    const data = await client.get(`${this.prefix}${sessionId}`)

    if (!data) return null

    try {
      const session = JSON.parse(data)

      // Check if session expired
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        await this.destroy(sessionId)
        return null
      }

      return session
    } catch {
      return null
    }
  }

  /**
   * Set session data
   */
  async set(
    sessionId: string,
    data: any,
    ttlSeconds?: number
  ): Promise<void> {
    const client = await redisManager.getClient()
    const ttl = ttlSeconds || this.defaultTTL

    const session = {
      ...data,
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    }

    await client.setEx(
      `${this.prefix}${sessionId}`,
      ttl,
      JSON.stringify(session)
    )
  }

  /**
   * Update session expiry
   */
  async touch(sessionId: string, ttlSeconds?: number): Promise<void> {
    const client = await redisManager.getClient()
    const ttl = ttlSeconds || this.defaultTTL

    await client.expire(`${this.prefix}${sessionId}`, ttl)
  }

  /**
   * Destroy session
   */
  async destroy(sessionId: string): Promise<void> {
    const client = await redisManager.getClient()
    await client.del(`${this.prefix}${sessionId}`)
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    const client = await redisManager.getClient()
    const keys = await client.keys(`${this.prefix}user:${userId}:*`)

    return keys.map(key => key.replace(this.prefix, ''))
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId)

    if (sessions.length > 0) {
      const client = await redisManager.getClient()
      await client.del(sessions.map(id => `${this.prefix}${id}`))
    }
  }
}

// Export instances
export const rateLimiter = new RedisRateLimiter()
export const cacheManager = new RedisCacheManager()
export const sessionStore = new RedisSessionStore()