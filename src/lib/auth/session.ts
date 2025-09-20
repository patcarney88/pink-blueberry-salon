/**
 * Session Management for Pink Blueberry Salon
 * Handles user sessions, authentication state, and session persistence
 */

import { getServerSession } from 'next-auth/next';
import { authOptions, ExtendedSession } from './config';
import { db } from '@/lib/db/client';
import { JWTManager } from './jwt';
import { RBACManager } from './rbac';

/**
 * Session interface
 */
export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
  active: boolean;
  lastActivity?: Date;
}

/**
 * Session validation result
 */
export interface SessionValidation {
  valid: boolean;
  session?: SessionData;
  user?: any;
  error?: string;
}

/**
 * Session Manager class
 */
export class SessionManager {
  /**
   * Get current server-side session
   */
  static async getServerSession(): Promise<ExtendedSession | null> {
    try {
      const session = await getServerSession(authOptions);
      return session as ExtendedSession;
    } catch (error) {
      console.error('Get server session error:', error);
      return null;
    }
  }

  /**
   * Create new session
   */
  static async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // Check for existing active sessions
      const existingSessions = await db.session.count({
        where: {
          userId,
          expires: {
            gt: new Date(),
          },
        },
      });

      // Limit concurrent sessions (configurable)
      const maxSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5');
      if (existingSessions >= maxSessions) {
        // Remove oldest session
        const oldestSession = await db.session.findFirst({
          where: {
            userId,
            expires: {
              gt: new Date(),
            },
          },
          orderBy: {
            expires: 'asc',
          },
        });

        if (oldestSession) {
          await db.session.delete({
            where: { id: oldestSession.id },
          });
        }
      }

      // Create new session
      const sessionId = JWTManager.generateSecureToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const session = await db.session.create({
        data: {
          id: sessionId,
          sessionToken: sessionId,
          userId,
          expires: expiresAt,
        },
      });

      // Log session creation
      await db.auditLog.create({
        data: {
          user_id: userId,
          action: 'SESSION_CREATE',
          entity_type: 'Session',
          entity_id: sessionId,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: {
            sessionId,
            expiresAt,
          },
        },
      });

      return { success: true, sessionId };
    } catch (error) {
      console.error('Create session error:', error);
      return { success: false, error: 'Failed to create session' };
    }
  }

  /**
   * Validate session by token
   */
  static async validateSession(sessionToken: string): Promise<SessionValidation> {
    try {
      // Find session in database
      const session = await db.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              tenant: true,
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
          },
        },
      });

      if (!session) {
        return { valid: false, error: 'Session not found' };
      }

      // Check if session is expired
      if (session.expires < new Date()) {
        // Clean up expired session
        await db.session.delete({
          where: { id: session.id },
        });
        return { valid: false, error: 'Session expired' };
      }

      // Check if user is still active
      if (!session.user.is_active) {
        return { valid: false, error: 'User account is inactive' };
      }

      // Update last activity
      await db.session.update({
        where: { id: session.id },
        data: {
          // Note: Prisma doesn't have lastActivity field in schema
          // You might want to add this to the Session model
        },
      });

      // Get effective permissions
      const rolePermissions = session.user.user_roles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.resource + ':' + rp.permission.action)
      );
      const directPermissions = session.user.permissions.map(up =>
        up.permission.resource + ':' + up.permission.action
      );
      const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

      return {
        valid: true,
        session: {
          id: session.id,
          userId: session.userId,
          token: session.sessionToken,
          expiresAt: session.expires,
          createdAt: session.expires, // Note: Using expires as created_at since it's not in schema
          ipAddress: '0.0.0.0', // Not stored in current schema
          userAgent: '', // Not stored in current schema
          active: true,
        },
        user: {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.first_name,
          lastName: session.user.last_name,
          tenantId: session.user.tenant_id,
          role: session.user.user_roles[0]?.role.name || 'CUSTOMER',
          permissions: allPermissions,
          emailVerified: session.user.email_verified,
          mfaEnabled: session.user.two_factor_enabled,
          avatar: session.user.avatar,
        },
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, error: 'Session validation failed' };
    }
  }

  /**
   * Extend session expiry
   */
  static async extendSession(
    sessionId: string,
    extensionMinutes: number = 30
  ): Promise<{ success: boolean; newExpiresAt?: Date; error?: string }> {
    try {
      const session = await db.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Calculate new expiry time
      const newExpiresAt = new Date(Date.now() + extensionMinutes * 60 * 1000);

      // Update session expiry
      await db.session.update({
        where: { id: sessionId },
        data: { expires: newExpiresAt },
      });

      return { success: true, newExpiresAt };
    } catch (error) {
      console.error('Extend session error:', error);
      return { success: false, error: 'Failed to extend session' };
    }
  }

  /**
   * Terminate session
   */
  static async terminateSession(
    sessionId: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await db.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Delete session
      await db.session.delete({
        where: { id: sessionId },
      });

      // Log session termination
      await db.auditLog.create({
        data: {
          user_id: userId || session.userId,
          action: 'SESSION_TERMINATE',
          entity_type: 'Session',
          entity_id: sessionId,
          metadata: {
            sessionId,
            terminatedBy: userId || 'system',
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Terminate session error:', error);
      return { success: false, error: 'Failed to terminate session' };
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessions = await db.session.findMany({
        where: {
          userId,
          expires: {
            gt: new Date(),
          },
        },
        orderBy: {
          expires: 'desc',
        },
      });

      return sessions.map(session => ({
        id: session.id,
        userId: session.userId,
        token: session.sessionToken,
        expiresAt: session.expires,
        createdAt: session.expires, // Using expires as fallback
        ipAddress: '0.0.0.0', // Not in current schema
        userAgent: '', // Not in current schema
        active: true,
      }));
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }

  /**
   * Terminate all sessions for a user
   */
  static async terminateAllUserSessions(
    userId: string,
    excludeSessionId?: string
  ): Promise<{ success: boolean; terminatedCount?: number; error?: string }> {
    try {
      const whereClause: any = { userId };

      if (excludeSessionId) {
        whereClause.id = { not: excludeSessionId };
      }

      const sessions = await db.session.findMany({
        where: whereClause,
      });

      // Delete sessions
      const result = await db.session.deleteMany({
        where: whereClause,
      });

      // Log bulk session termination
      await db.auditLog.create({
        data: {
          user_id: userId,
          action: 'SESSION_TERMINATE_ALL',
          entity_type: 'Session',
          entity_id: userId,
          metadata: {
            terminatedCount: result.count,
            excludedSessionId: excludeSessionId,
          },
        },
      });

      return { success: true, terminatedCount: result.count };
    } catch (error) {
      console.error('Terminate all user sessions error:', error);
      return { success: false, error: 'Failed to terminate sessions' };
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await db.session.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired sessions`);
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    totalActiveSessions: number;
    userSessionCounts: { userId: string; sessionCount: number }[];
    avgSessionDuration: number;
  }> {
    try {
      // Get active sessions count
      const totalActiveSessions = await db.session.count({
        where: {
          expires: {
            gt: new Date(),
          },
        },
      });

      // Get session counts per user
      const userSessions = await db.session.groupBy({
        by: ['userId'],
        where: {
          expires: {
            gt: new Date(),
          },
        },
        _count: {
          id: true,
        },
      });

      const userSessionCounts = userSessions.map(us => ({
        userId: us.userId,
        sessionCount: us._count.id,
      }));

      // Calculate average session duration (simplified)
      const avgSessionDuration = 30 * 24 * 60 * 60 * 1000; // Default to 30 days in ms

      return {
        totalActiveSessions,
        userSessionCounts,
        avgSessionDuration,
      };
    } catch (error) {
      console.error('Get session stats error:', error);
      return {
        totalActiveSessions: 0,
        userSessionCounts: [],
        avgSessionDuration: 0,
      };
    }
  }

  /**
   * Check if user has active sessions
   */
  static async hasActiveSessions(userId: string): Promise<boolean> {
    try {
      const activeSessionCount = await db.session.count({
        where: {
          userId,
          expires: {
            gt: new Date(),
          },
        },
      });

      return activeSessionCount > 0;
    } catch (error) {
      console.error('Check active sessions error:', error);
      return false;
    }
  }

  /**
   * Refresh session (extend and update activity)
   */
  static async refreshSession(sessionId: string): Promise<SessionValidation> {
    try {
      // First validate the session
      const validation = await this.validateSession(sessionId);

      if (!validation.valid || !validation.session) {
        return validation;
      }

      // Extend session by default extension time
      const extensionResult = await this.extendSession(sessionId);

      if (!extensionResult.success) {
        return { valid: false, error: extensionResult.error };
      }

      // Return updated validation result
      return {
        ...validation,
        session: {
          ...validation.session,
          expiresAt: extensionResult.newExpiresAt!,
        },
      };
    } catch (error) {
      console.error('Refresh session error:', error);
      return { valid: false, error: 'Failed to refresh session' };
    }
  }
}

/**
 * Session hooks for React components
 */
export const useSession = () => {
  // This would typically use React context or a state management library
  // For now, providing the structure for future implementation
  return {
    data: null as ExtendedSession | null,
    status: 'loading' as 'loading' | 'authenticated' | 'unauthenticated',
    update: async () => {},
  };
};

/**
 * Session utilities
 */
export const sessionUtils = {
  /**
   * Check if user has permission
   */
  hasPermission: async (
    session: ExtendedSession | null,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    return RBACManager.hasPermission(session.user.id, resource, action, context);
  },

  /**
   * Get user role
   */
  getUserRole: (session: ExtendedSession | null): string | null => {
    return session?.user?.role || null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (session: ExtendedSession | null): boolean => {
    return !!session?.user?.id;
  },

  /**
   * Check if user is in specific role
   */
  hasRole: (session: ExtendedSession | null, role: string): boolean => {
    return session?.user?.role === role;
  },

  /**
   * Check if user belongs to tenant
   */
  belongsToTenant: (session: ExtendedSession | null, tenantId: string): boolean => {
    return session?.user?.tenantId === tenantId;
  },
};