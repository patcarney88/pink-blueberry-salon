import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db/prisma'
import { createHash, randomBytes } from 'crypto'
import { redis } from '@/lib/redis/client'

interface TokenPayload {
  userId: string
  email: string
  roles: string[]
  sessionId: string
  type: 'access' | 'refresh'
}

interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

interface RefreshTokenData {
  userId: string
  sessionId: string
  deviceId?: string
  userAgent?: string
  ip?: string
  createdAt: Date
  expiresAt: Date
  lastUsedAt?: Date
  revoked?: boolean
}

export class JWTManager {
  private readonly accessTokenSecret: string
  private readonly refreshTokenSecret: string
  private readonly accessTokenExpiry: string = '15m'
  private readonly refreshTokenExpiry: string = '7d'
  private readonly maxRefreshTokens: number = 5 // Max refresh tokens per user

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET!
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || `${process.env.NEXTAUTH_SECRET}_refresh`

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets not configured')
    }
  }

  /**
   * Generate a token pair (access + refresh)
   */
  async generateTokenPair(
    userId: string,
    email: string,
    roles: string[],
    deviceInfo?: {
      deviceId?: string
      userAgent?: string
      ip?: string
    }
  ): Promise<TokenPair> {
    const sessionId = this.generateSessionId()

    // Generate access token
    const accessPayload: TokenPayload = {
      userId,
      email,
      roles,
      sessionId,
      type: 'access',
    }

    const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'pink-blueberry',
      audience: 'api',
    })

    // Generate refresh token
    const refreshPayload: TokenPayload = {
      userId,
      email,
      roles,
      sessionId,
      type: 'refresh',
    }

    const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'pink-blueberry',
      audience: 'refresh',
    })

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await prisma.refreshToken.create({
      data: {
        token: this.hashToken(refreshToken),
        user_id: userId,
        session_id: sessionId,
        device_id: deviceInfo?.deviceId,
        user_agent: deviceInfo?.userAgent,
        ip_address: deviceInfo?.ip,
        expires_at: expiresAt,
      },
    })

    // Store in Redis for fast lookup
    await this.storeTokenInRedis(refreshToken, {
      userId,
      sessionId,
      deviceId: deviceInfo?.deviceId,
      userAgent: deviceInfo?.userAgent,
      ip: deviceInfo?.ip,
      createdAt: new Date(),
      expiresAt,
    })

    // Clean up old refresh tokens for this user
    await this.cleanupOldTokens(userId)

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      refreshExpiresIn: 604800, // 7 days in seconds
    }
  }

  /**
   * Verify an access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token)
      if (isBlacklisted) {
        throw new Error('Token has been revoked')
      }

      const payload = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'pink-blueberry',
        audience: 'api',
      }) as TokenPayload

      if (payload.type !== 'access') {
        throw new Error('Invalid token type')
      }

      return payload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired')
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token')
      }
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    deviceInfo?: {
      deviceId?: string
      userAgent?: string
      ip?: string
    }
  ): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret, {
        issuer: 'pink-blueberry',
        audience: 'refresh',
      }) as TokenPayload

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      // Check if refresh token exists and is valid
      const hashedToken = this.hashToken(refreshToken)
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: hashedToken,
          user_id: payload.userId,
          revoked: false,
          expires_at: {
            gt: new Date(),
          },
        },
      })

      if (!storedToken) {
        // Possible token reuse attack - revoke all tokens for this user
        await this.revokeAllUserTokens(payload.userId, 'Possible token reuse detected')
        throw new Error('Invalid refresh token')
      }

      // Check Redis for additional validation
      const redisData = await this.getTokenFromRedis(refreshToken)
      if (!redisData || redisData.revoked) {
        throw new Error('Refresh token revoked')
      }

      // Verify device fingerprint if provided
      if (deviceInfo?.deviceId && storedToken.device_id !== deviceInfo.deviceId) {
        await this.logSecurityEvent(payload.userId, 'DEVICE_MISMATCH', {
          expected: storedToken.device_id,
          received: deviceInfo.deviceId,
        })
        throw new Error('Device mismatch')
      }

      // Update last used timestamp
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { last_used_at: new Date() },
      })

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { roles: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Rotate refresh token (one-time use)
      await this.revokeToken(refreshToken)

      // Generate new token pair
      return await this.generateTokenPair(
        user.id,
        user.email,
        user.roles.map(r => r.name),
        deviceInfo
      )
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired')
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token')
      }
      throw error
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token)

    // Revoke in database
    await prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    })

    // Add to blacklist in Redis
    await this.blacklistToken(token)

    // Remove from Redis storage
    await redis.del(`refresh_token:${hashedToken}`)
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string, reason?: string): Promise<void> {
    // Revoke in database
    await prisma.refreshToken.updateMany({
      where: {
        user_id: userId,
        revoked: false,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
        revoke_reason: reason,
      },
    })

    // Clear from Redis
    const keys = await redis.keys(`refresh_token:user:${userId}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }

    // Log security event
    await this.logSecurityEvent(userId, 'ALL_TOKENS_REVOKED', { reason })
  }

  /**
   * Revoke all tokens for a session
   */
  async revokeSessionTokens(sessionId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        session_id: sessionId,
        revoked: false,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    })
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          {
            revoked: true,
            revoked_at: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            },
          },
        ],
      },
    })

    return result.count
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: string): Promise<any[]> {
    const tokens = await prisma.refreshToken.findMany({
      where: {
        user_id: userId,
        revoked: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { last_used_at: 'desc' },
    })

    return tokens.map(token => ({
      sessionId: token.session_id,
      deviceId: token.device_id,
      userAgent: token.user_agent,
      ipAddress: token.ip_address,
      createdAt: token.created_at,
      lastUsedAt: token.last_used_at,
      expiresAt: token.expires_at,
    }))
  }

  // Helper methods

  private generateSessionId(): string {
    return randomBytes(32).toString('hex')
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private async storeTokenInRedis(token: string, data: RefreshTokenData): Promise<void> {
    const hashedToken = this.hashToken(token)
    const key = `refresh_token:${hashedToken}`
    const userKey = `refresh_token:user:${data.userId}:${data.sessionId}`

    const ttl = Math.floor((data.expiresAt.getTime() - Date.now()) / 1000)

    await redis.setex(key, ttl, JSON.stringify(data))
    await redis.setex(userKey, ttl, hashedToken)
  }

  private async getTokenFromRedis(token: string): Promise<RefreshTokenData | null> {
    const hashedToken = this.hashToken(token)
    const data = await redis.get(`refresh_token:${hashedToken}`)

    if (!data) return null

    return JSON.parse(data)
  }

  private async blacklistToken(token: string): Promise<void> {
    const decoded = jwt.decode(token) as any
    if (!decoded) return

    const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600

    if (ttl > 0) {
      await redis.setex(`blacklist:${this.hashToken(token)}`, ttl, '1')
    }
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await redis.exists(`blacklist:${this.hashToken(token)}`)
    return exists === 1
  }

  private async cleanupOldTokens(userId: string): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({
      where: {
        user_id: userId,
        revoked: false,
      },
      orderBy: { created_at: 'desc' },
    })

    // Keep only the most recent tokens
    if (tokens.length > this.maxRefreshTokens) {
      const tokensToRevoke = tokens.slice(this.maxRefreshTokens)

      await prisma.refreshToken.updateMany({
        where: {
          id: { in: tokensToRevoke.map(t => t.id) },
        },
        data: {
          revoked: true,
          revoked_at: new Date(),
          revoke_reason: 'Max token limit exceeded',
        },
      })
    }
  }

  private async logSecurityEvent(
    userId: string,
    event: string,
    metadata?: any
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: event,
        entity_type: 'Security',
        entity_id: userId,
        metadata: {
          event,
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    })
  }
}

// Singleton instance
export const jwtManager = new JWTManager()