/**
 * Authentication Providers for Pink Blueberry Salon
 * Handles multiple authentication methods including social providers
 */

import { hash, compare } from 'bcryptjs';
import { db } from '@/lib/db/client';
import { SignInCredentials, SignUpData, AuthResult } from '@/lib/integration/contracts/auth.contract';
import { randomBytes, createHash } from 'crypto';

/**
 * Email/Password Authentication Provider
 */
export class CredentialsAuthProvider {
  /**
   * Sign up new user with email and password
   */
  static async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await db.user.findFirst({
        where: {
          email: data.email.toLowerCase(),
          deleted_at: null,
        },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email',
        };
      }

      // Get default tenant (for now - will need proper tenant selection)
      const defaultTenant = await db.tenant.findFirst({
        where: { is_active: true },
      });

      if (!defaultTenant) {
        return {
          success: false,
          error: 'No active tenant available',
        };
      }

      // Hash password
      const passwordHash = await hash(data.password, 12);

      // Generate email verification token
      const emailVerificationToken = randomBytes(32).toString('hex');

      // Create user
      const user = await db.user.create({
        data: {
          tenant_id: defaultTenant.id,
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          metadata: {
            emailVerificationToken,
            acceptedTerms: data.acceptTerms,
            signUpMethod: 'credentials',
          },
        },
        include: {
          tenant: true,
        },
      });

      // Assign default customer role
      const customerRole = await db.role.findFirst({
        where: {
          tenant_id: defaultTenant.id,
          name: 'CUSTOMER',
        },
      });

      if (customerRole) {
        await db.userRole.create({
          data: {
            user_id: user.id,
            role_id: customerRole.id,
          },
        });
      }

      // Create customer profile
      await db.customer.create({
        data: {
          tenant_id: defaultTenant.id,
          user_id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
        },
      });

      // Log audit event
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'CREATE',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            signUpMethod: 'credentials',
            tenantId: defaultTenant.id,
          },
        },
      });

      // Send verification email (placeholder - implement email service)
      await this.sendVerificationEmail(user.email, emailVerificationToken);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          emailVerified: user.email_verified,
          role: 'CUSTOMER',
          permissions: [],
          createdAt: user.created_at,
          mfaEnabled: user.two_factor_enabled,
          locked: !user.is_active,
        },
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: 'Failed to create account',
      };
    }
  }

  /**
   * Sign in user with email and password
   */
  static async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    try {
      // Find user
      const user = await db.user.findFirst({
        where: {
          email: credentials.email.toLowerCase(),
          deleted_at: null,
        },
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
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if account is active
      if (!user.is_active) {
        return {
          success: false,
          error: 'Account is locked',
        };
      }

      // Verify password
      const isValidPassword = await compare(credentials.password, user.password_hash);
      if (!isValidPassword) {
        // Log failed login attempt
        await db.auditLog.create({
          data: {
            user_id: user.id,
            action: 'LOGIN_FAILED',
            entity_type: 'User',
            entity_id: user.id,
            metadata: {
              reason: 'invalid_password',
            },
          },
        });

        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if MFA is required
      if (user.two_factor_enabled) {
        return {
          success: false,
          requiresMFA: true,
          error: 'Multi-factor authentication required',
        };
      }

      // Get permissions
      const rolePermissions = user.user_roles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.resource + ':' + rp.permission.action)
      );
      const directPermissions = user.permissions.map(up =>
        up.permission.resource + ':' + up.permission.action
      );
      const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      // Generate tokens (simplified - in production use proper JWT library)
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Log successful login
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'LOGIN',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            method: 'credentials',
            success: true,
          },
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          emailVerified: user.email_verified,
          role: user.user_roles[0]?.role.name || 'CUSTOMER',
          permissions: allPermissions,
          createdAt: user.created_at,
          lastLoginAt: new Date(),
          mfaEnabled: user.two_factor_enabled,
          locked: !user.is_active,
          avatar: user.avatar,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Generate access token (simplified)
   */
  private static generateAccessToken(userId: string): string {
    return createHash('sha256')
      .update(`${userId}:${Date.now()}:${process.env.NEXTAUTH_SECRET}`)
      .digest('hex');
  }

  /**
   * Generate refresh token (simplified)
   */
  private static generateRefreshToken(userId: string): string {
    return createHash('sha256')
      .update(`${userId}:refresh:${Date.now()}:${process.env.NEXTAUTH_SECRET}`)
      .digest('hex');
  }

  /**
   * Send verification email (placeholder)
   */
  private static async sendVerificationEmail(email: string, token: string): Promise<void> {
    // TODO: Implement email service integration
    console.log(`Verification email would be sent to ${email} with token ${token}`);
  }
}

/**
 * Google OAuth Provider
 */
export class GoogleAuthProvider {
  /**
   * Handle Google OAuth callback
   */
  static async handleCallback(profile: any, account: any): Promise<AuthResult> {
    try {
      // Find or create user
      let user = await db.user.findFirst({
        where: {
          email: profile.email.toLowerCase(),
          deleted_at: null,
        },
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
        },
      });

      if (!user) {
        // Get default tenant
        const defaultTenant = await db.tenant.findFirst({
          where: { is_active: true },
        });

        if (!defaultTenant) {
          return {
            success: false,
            error: 'No active tenant available',
          };
        }

        // Create new user
        user = await db.user.create({
          data: {
            tenant_id: defaultTenant.id,
            email: profile.email.toLowerCase(),
            password_hash: '', // OAuth users don't have passwords
            first_name: profile.given_name || profile.name?.split(' ')[0] || '',
            last_name: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
            avatar: profile.picture,
            email_verified: true, // Google emails are pre-verified
            metadata: {
              oauth_provider: 'google',
              oauth_id: account.providerAccountId,
            },
          },
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
          },
        });

        // Assign default customer role
        const customerRole = await db.role.findFirst({
          where: {
            tenant_id: defaultTenant.id,
            name: 'CUSTOMER',
          },
        });

        if (customerRole) {
          await db.userRole.create({
            data: {
              user_id: user.id,
              role_id: customerRole.id,
            },
          });
        }

        // Create customer profile
        await db.customer.create({
          data: {
            tenant_id: defaultTenant.id,
            user_id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
          },
        });
      }

      // Get permissions
      const rolePermissions = user.user_roles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.resource + ':' + rp.permission.action)
      );
      const allPermissions = [...new Set(rolePermissions)];

      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          emailVerified: user.email_verified,
          role: user.user_roles[0]?.role.name || 'CUSTOMER',
          permissions: allPermissions,
          createdAt: user.created_at,
          lastLoginAt: new Date(),
          mfaEnabled: user.two_factor_enabled,
          locked: !user.is_active,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        error: 'OAuth authentication failed',
      };
    }
  }
}

/**
 * Email Magic Link Provider
 */
export class EmailAuthProvider {
  /**
   * Send magic link to email
   */
  static async sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find user
      const user = await db.user.findFirst({
        where: {
          email: email.toLowerCase(),
          deleted_at: null,
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'No account found with this email',
        };
      }

      // Generate magic link token
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store token (simplified - in production use proper token storage)
      await db.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...user.metadata as any,
            magicLinkToken: token,
            magicLinkExpires: expires,
          },
        },
      });

      // Send email (placeholder)
      await this.sendMagicLinkEmail(email, token);

      return { success: true };
    } catch (error) {
      console.error('Magic link error:', error);
      return {
        success: false,
        error: 'Failed to send magic link',
      };
    }
  }

  /**
   * Verify magic link token
   */
  static async verifyMagicLink(token: string): Promise<AuthResult> {
    try {
      // Find user by token
      const user = await db.user.findFirst({
        where: {
          deleted_at: null,
          // This is simplified - in production, store tokens in separate table
        },
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
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid magic link',
        };
      }

      // Verify token and expiry (simplified)
      const metadata = user.metadata as any;
      if (metadata.magicLinkToken !== token || new Date() > new Date(metadata.magicLinkExpires)) {
        return {
          success: false,
          error: 'Magic link expired or invalid',
        };
      }

      // Clear token
      await db.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...metadata,
            magicLinkToken: null,
            magicLinkExpires: null,
          },
          last_login: new Date(),
        },
      });

      // Get permissions
      const rolePermissions = user.user_roles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission.resource + ':' + rp.permission.action)
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          emailVerified: user.email_verified,
          role: user.user_roles[0]?.role.name || 'CUSTOMER',
          permissions: rolePermissions,
          createdAt: user.created_at,
          lastLoginAt: new Date(),
          mfaEnabled: user.two_factor_enabled,
          locked: !user.is_active,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      console.error('Magic link verification error:', error);
      return {
        success: false,
        error: 'Magic link verification failed',
      };
    }
  }

  /**
   * Send magic link email (placeholder)
   */
  private static async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    // TODO: Implement email service integration
    console.log(`Magic link would be sent to ${email} with token ${token}`);
  }
}