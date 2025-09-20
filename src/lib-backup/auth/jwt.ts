/**
 * JWT Token Management for Pink Blueberry Salon
 * Secure token generation, validation, and refresh functionality
 */

import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { db } from '@/lib/db/client';

// JWT Configuration
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production';
const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const VERIFICATION_TOKEN_EXPIRY = '24h';
const RESET_TOKEN_EXPIRY = '1h';

/**
 * JWT Payload interface
 */
export interface JWTPayload {
  sub: string; // user ID
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
  sessionId?: string;
  tokenType: 'access' | 'refresh' | 'verification' | 'reset' | 'mfa';
  iat: number;
  exp: number;
  jti?: string; // JWT ID for tracking
}

/**
 * Token pair interface
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

/**
 * JWT Token Manager
 */
export class JWTManager {
  /**
   * Generate access token
   */
  static generateAccessToken(
    userId: string,
    email: string,
    tenantId: string,
    role: string,
    permissions: string[],
    sessionId?: string
  ): string {
    const payload: JWTPayload = {
      sub: userId,
      email,
      tenantId,
      role,
      permissions,
      sessionId,
      tokenType: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
      jti: randomBytes(16).toString('hex'),
    };

    return jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string, sessionId?: string): string {
    const payload = {
      sub: userId,
      sessionId,
      tokenType: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      jti: randomBytes(16).toString('hex'),
    };

    return jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
    });
  }

  /**
   * Generate email verification token
   */
  static generateVerificationToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      tokenType: 'verification',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      jti: randomBytes(16).toString('hex'),
    };

    return jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
    });
  }

  /**
   * Generate password reset token
   */
  static generateResetToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      tokenType: 'reset',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      jti: randomBytes(16).toString('hex'),
    };

    return jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
    });
  }

  /**
   * Generate MFA token
   */
  static generateMFAToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      tokenType: 'mfa',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes
      jti: randomBytes(16).toString('hex'),
    };

    return jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
    });
  }

  /**
   * Generate token pair (access + refresh)
   */
  static async generateTokenPair(
    userId: string,
    email: string,
    tenantId: string,
    role: string,
    permissions: string[]
  ): Promise<TokenPair> {
    // Generate session ID
    const sessionId = randomBytes(16).toString('hex');

    // Create session record
    await db.session.create({
      data: {
        id: sessionId,
        sessionToken: sessionId,
        userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const accessToken = this.generateAccessToken(userId, email, tenantId, role, permissions, sessionId);
    const refreshToken = this.generateRefreshToken(userId, sessionId);

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Access token expiry
      tokenType: 'Bearer',
    };
  }

  /**
   * Verify and decode token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
      }) as JWTPayload;

      // Check if token is expired
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      const decoded = this.verifyToken(refreshToken);

      if (!decoded || decoded.tokenType !== 'refresh') {
        return null;
      }

      // Get user data from database
      const user = await db.user.findUnique({
        where: { id: decoded.sub },
        include: {
          user_roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user || !user.is_active) {
        return null;
      }

      // Verify session still exists
      if (decoded.sessionId) {
        const session = await db.session.findUnique({
          where: { id: decoded.sessionId },
        });

        if (!session || session.expires < new Date()) {
          return null;
        }
      }

      // Get current permissions
      const rolePermissions = user.user_roles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.resource + ':' + rp.permission.action)
      );
      const directPermissions = user.permissions.map(up =>
        up.permission.resource + ':' + up.permission.action
      );
      const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

      // Generate new access token
      const accessToken = this.generateAccessToken(
        user.id,
        user.email,
        user.tenant_id,
        user.user_roles[0]?.role.name || 'CUSTOMER',
        allPermissions,
        decoded.sessionId
      );

      return {
        accessToken,
        refreshToken, // Keep the same refresh token
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        tokenType: 'Bearer',
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Revoke token (add to blacklist)
   */
  static async revokeToken(token: string): Promise<boolean> {
    try {
      const decoded = this.verifyToken(token);

      if (!decoded || !decoded.jti) {
        return false;
      }

      // Add token to blacklist (implement blacklist table)
      // For now, we'll invalidate the session
      if (decoded.sessionId) {
        await db.session.delete({
          where: { id: decoded.sessionId },
        });
      }

      return true;
    } catch (error) {
      console.error('Token revocation error:', error);
      return false;
    }
  }

  /**
   * Validate token and return user info
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const decoded = this.verifyToken(token);

      if (!decoded) {
        return { valid: false, error: 'Invalid token' };
      }

      // Get user from database
      const user = await db.user.findUnique({
        where: { id: decoded.sub },
        include: {
          tenant: true,
          user_roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || !user.is_active) {
        return { valid: false, error: 'User not found or inactive' };
      }

      // Verify session if present
      if (decoded.sessionId) {
        const session = await db.session.findUnique({
          where: { id: decoded.sessionId },
        });

        if (!session || session.expires < new Date()) {
          return { valid: false, error: 'Session expired' };
        }
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          tenantId: user.tenant_id,
          role: decoded.role,
          permissions: decoded.permissions,
          emailVerified: user.email_verified,
          mfaEnabled: user.two_factor_enabled,
        },
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Generate secure random token (for non-JWT use cases)
   */
  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash token for storage (one-way)
   */
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await db.session.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}

/**
 * JWT Middleware for API routes
 */
export function withJWTAuth(handler: any) {
  return async (req: any, res: any) => {
    try {
      const token = JWTManager.extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const validation = await JWTManager.validateToken(token);

      if (!validation.valid) {
        return res.status(401).json({ error: validation.error });
      }

      // Add user to request object
      req.user = validation.user;

      return handler(req, res);
    } catch (error) {
      console.error('JWT middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}