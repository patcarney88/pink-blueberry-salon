/**
 * NextAuth.js Configuration for Pink Blueberry Salon
 * Multi-tenant authentication with JWT and role-based access control
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db/client';
import { AuthResult, User } from '@/lib/integration/contracts/auth.contract';

// JWT configuration
const JWT_SECRET = process.env.NEXTAUTH_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '30d';

/**
 * Custom JWT token interface
 */
interface ExtendedJWT extends JWT {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
}

/**
 * Custom session interface
 */
interface ExtendedSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    tenantId: string;
    role: string;
    permissions: string[];
    mfaEnabled: boolean;
    emailVerified: boolean;
    lastLogin?: Date;
  };
  expires: string;
}

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  // Use Prisma adapter for database integration
  adapter: PrismaAdapter(db),

  providers: [
    // Email/Password Authentication
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantId: { label: 'Tenant ID', type: 'text' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user by email and tenant
          const user = await db.user.findFirst({
            where: {
              email: credentials.email.toLowerCase(),
              tenant_id: credentials.tenantId || undefined,
              deleted_at: null,
              is_active: true,
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
            throw new Error('Invalid credentials');
          }

          // Verify password
          const isValidPassword = await compare(credentials.password, user.password_hash);
          if (!isValidPassword) {
            throw new Error('Invalid credentials');
          }

          // Check if account is locked
          if (!user.is_active) {
            throw new Error('Account is locked');
          }

          // Get all permissions (from roles + direct permissions)
          const rolePermissions = user.user_roles.flatMap(ur =>
            ur.role.permissions.map(rp => rp.permission.resource + ':' + rp.permission.action)
          );
          const directPermissions = user.permissions.map(up =>
            up.permission.resource + ':' + up.permission.action
          );
          const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

          // Get primary role
          const primaryRole = user.user_roles[0]?.role.name || 'CUSTOMER';

          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { last_login: new Date() },
          });

          // Log security event
          await db.auditLog.create({
            data: {
              user_id: user.id,
              action: 'LOGIN',
              entity_type: 'User',
              entity_id: user.id,
              ip_address: '0.0.0.0', // Will be set by middleware
              metadata: {
                success: true,
                method: 'credentials',
              },
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            image: user.avatar,
            tenantId: user.tenant_id,
            role: primaryRole,
            permissions: allPermissions,
            mfaEnabled: user.two_factor_enabled,
            emailVerified: user.email_verified,
            lastLogin: user.last_login,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Email Magic Link Provider
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  // JWT Configuration
  jwt: {
    secret: JWT_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Session Configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Callback Functions
  callbacks: {
    async jwt({ token, user, account, trigger, session }): Promise<ExtendedJWT> {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
        token.permissions = user.permissions;
        token.mfaEnabled = user.mfaEnabled;
        token.emailVerified = user.emailVerified;
        token.lastLogin = user.lastLogin;
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        // Refresh user data from database
        try {
          const updatedUser = await db.user.findUnique({
            where: { id: token.userId },
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

          if (updatedUser) {
            const rolePermissions = updatedUser.user_roles.flatMap(ur =>
              ur.role.permissions.map(rp => rp.permission.resource + ':' + rp.permission.action)
            );
            const directPermissions = updatedUser.permissions.map(up =>
              up.permission.resource + ':' + up.permission.action
            );
            const allPermissions = [...new Set([...rolePermissions, ...directPermissions])];

            token.role = updatedUser.user_roles[0]?.role.name || 'CUSTOMER';
            token.permissions = allPermissions;
            token.mfaEnabled = updatedUser.two_factor_enabled;
            token.emailVerified = updatedUser.email_verified;
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }

      return token as ExtendedJWT;
    },

    async session({ session, token }): Promise<ExtendedSession> {
      const extendedToken = token as ExtendedJWT;

      return {
        ...session,
        user: {
          id: extendedToken.userId,
          email: extendedToken.email!,
          name: extendedToken.name!,
          image: extendedToken.picture,
          tenantId: extendedToken.tenantId,
          role: extendedToken.role,
          permissions: extendedToken.permissions,
          mfaEnabled: extendedToken.mfaEnabled,
          emailVerified: extendedToken.emailVerified,
          lastLogin: extendedToken.lastLogin,
        },
      } as ExtendedSession;
    },

    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Handle OAuth sign ins
        if (account?.provider === 'google') {
          // Find or create user for Google OAuth
          const existingUser = await db.user.findFirst({
            where: {
              email: user.email!.toLowerCase(),
              deleted_at: null,
            },
          });

          if (!existingUser) {
            // Create new user with default tenant (will need tenant selection flow)
            // For now, assign to first available tenant
            const defaultTenant = await db.tenant.findFirst({
              where: { is_active: true },
            });

            if (!defaultTenant) {
              throw new Error('No active tenant available');
            }

            await db.user.create({
              data: {
                tenant_id: defaultTenant.id,
                email: user.email!.toLowerCase(),
                password_hash: '', // OAuth users don't have passwords
                first_name: user.name?.split(' ')[0] || '',
                last_name: user.name?.split(' ').slice(1).join(' ') || '',
                avatar: user.image,
                email_verified: true, // OAuth emails are pre-verified
                metadata: {
                  oauth_provider: 'google',
                  oauth_id: account.providerAccountId,
                },
              },
            });
          }
        }

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Custom Pages
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/welcome',
  },

  // Event Handlers
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign in
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'LOGIN',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            provider: account?.provider,
            isNewUser,
          },
        },
      });
    },

    async signOut({ session, token }) {
      // Log sign out
      if (token?.userId) {
        await db.auditLog.create({
          data: {
            user_id: token.userId as string,
            action: 'LOGOUT',
            entity_type: 'User',
            entity_id: token.userId as string,
            metadata: {},
          },
        });
      }
    },

    async createUser({ user }) {
      // Log user creation
      await db.auditLog.create({
        data: {
          user_id: user.id,
          action: 'CREATE',
          entity_type: 'User',
          entity_id: user.id,
          metadata: {
            method: 'oauth',
          },
        },
      });
    },
  },

  // Security options
  useSecureCookies: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Type exports for use throughout the application
 */
export type { ExtendedJWT, ExtendedSession };