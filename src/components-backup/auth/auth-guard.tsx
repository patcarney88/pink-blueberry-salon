/**
 * Authentication Guard Components for Pink Blueberry Salon
 * Protects routes and components based on authentication and authorization
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, usePermission, useRole } from './auth-provider';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Auth Guard Props
 */
interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRoles?: string | string[];
  requirePermissions?: {
    resource: string;
    action: string;
    context?: Record<string, any>;
  }[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Main Authentication Guard Component
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requireRoles,
  requirePermissions,
  fallback,
  redirectTo = '/auth/signin',
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setChecking(false);
    }
  }, [isLoading]);

  // Show loading while checking authentication
  if (checking || isLoading) {
    return fallback || <AuthLoadingSpinner />;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (redirectTo) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return <AuthLoadingSpinner />;
    }
    return fallback || <UnauthorizedMessage type="unauthenticated" />;
  }

  // If no additional requirements, show children
  if (!requireRoles && !requirePermissions) {
    return <>{children}</>;
  }

  // Check role requirements
  if (requireRoles) {
    return (
      <RoleGuard roles={requireRoles} fallback={fallback}>
        {requirePermissions ? (
          <PermissionGuard permissions={requirePermissions} fallback={fallback}>
            {children}
          </PermissionGuard>
        ) : (
          children
        )}
      </RoleGuard>
    );
  }

  // Check permission requirements
  if (requirePermissions) {
    return (
      <PermissionGuard permissions={requirePermissions} fallback={fallback}>
        {children}
      </PermissionGuard>
    );
  }

  return <>{children}</>;
}

/**
 * Role-based Guard Component
 */
interface RoleGuardProps {
  children: React.ReactNode;
  roles: string | string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { hasRole } = useRole(roles);

  if (!hasRole) {
    return fallback || <UnauthorizedMessage type="insufficient-role" requiredRoles={roles} />;
  }

  return <>{children}</>;
}

/**
 * Permission-based Guard Component
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: {
    resource: string;
    action: string;
    context?: Record<string, any>;
  }[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = all permissions required, false = any permission required
}

export function PermissionGuard({
  children,
  permissions,
  fallback,
  requireAll = true,
}: PermissionGuardProps) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { hasPermission, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const checkPermissions = async () => {
      try {
        const permissionResults = await Promise.all(
          permissions.map(({ resource, action, context }) =>
            hasPermission(resource, action, context)
          )
        );

        const hasRequiredPermissions = requireAll
          ? permissionResults.every(result => result)
          : permissionResults.some(result => result);

        setAllowed(hasRequiredPermissions);
      } catch (error) {
        console.error('Permission check error:', error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [hasPermission, permissions, requireAll, isAuthenticated]);

  if (loading) {
    return <AuthLoadingSpinner />;
  }

  if (!allowed) {
    return fallback || <UnauthorizedMessage type="insufficient-permissions" requiredPermissions={permissions} />;
  }

  return <>{children}</>;
}

/**
 * Email Verification Guard
 */
interface EmailVerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function EmailVerificationGuard({ children, fallback }: EmailVerificationGuardProps) {
  const { user } = useAuth();

  if (user && !user.emailVerified) {
    return fallback || <EmailVerificationRequired />;
  }

  return <>{children}</>;
}

/**
 * MFA Guard
 */
interface MFAGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MFAGuard({ children, fallback }: MFAGuardProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.mfaEnabled && !user.mfaVerified) {
      router.push('/auth/mfa');
    }
  }, [user, router]);

  if (user && user.mfaEnabled && !user.mfaVerified) {
    return fallback || <AuthLoadingSpinner />;
  }

  return <>{children}</>;
}

/**
 * Tenant Guard
 */
interface TenantGuardProps {
  children: React.ReactNode;
  tenantId: string;
  fallback?: React.ReactNode;
}

export function TenantGuard({ children, tenantId, fallback }: TenantGuardProps) {
  const { belongsToTenant, user } = useAuth();

  if (!user || (!belongsToTenant(tenantId) && user.role !== 'SUPER_ADMIN')) {
    return fallback || <UnauthorizedMessage type="wrong-tenant" />;
  }

  return <>{children}</>;
}

/**
 * Loading Spinner Component
 */
function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <Spinner className="h-8 w-8 mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Checking authentication...
        </p>
      </div>
    </div>
  );
}

/**
 * Unauthorized Message Component
 */
interface UnauthorizedMessageProps {
  type: 'unauthenticated' | 'insufficient-role' | 'insufficient-permissions' | 'wrong-tenant' | 'email-not-verified';
  requiredRoles?: string | string[];
  requiredPermissions?: { resource: string; action: string }[];
}

function UnauthorizedMessage({ type, requiredRoles, requiredPermissions }: UnauthorizedMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'unauthenticated':
        return <Lock className="h-12 w-12 text-gray-400" />;
      case 'email-not-verified':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      default:
        return <Shield className="h-12 w-12 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'unauthenticated':
        return 'Authentication Required';
      case 'insufficient-role':
        return 'Access Denied';
      case 'insufficient-permissions':
        return 'Insufficient Permissions';
      case 'wrong-tenant':
        return 'Access Denied';
      case 'email-not-verified':
        return 'Email Verification Required';
      default:
        return 'Access Denied';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'unauthenticated':
        return 'You need to sign in to access this page.';
      case 'insufficient-role':
        const roles = Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles;
        return `This page requires one of the following roles: ${roles}`;
      case 'insufficient-permissions':
        return 'You don\'t have the required permissions to access this page.';
      case 'wrong-tenant':
        return 'You don\'t have access to this organization.';
      case 'email-not-verified':
        return 'Please verify your email address to continue.';
      default:
        return 'You don\'t have permission to access this page.';
    }
  };

  const getActions = () => {
    switch (type) {
      case 'unauthenticated':
        return (
          <div className="space-y-2">
            <Link href="/auth/signin">
              <Button className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        );
      case 'email-not-verified':
        return (
          <div className="space-y-2">
            <Button className="w-full">
              Resend Verification Email
            </Button>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Button onClick={() => window.history.back()} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          {getIcon()}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {getTitle()}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getMessage()}
        </p>
        {requiredPermissions && (
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Required Permissions:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {requiredPermissions.map((perm, index) => (
                <li key={index}>
                  {perm.resource}:{perm.action}
                </li>
              ))}
            </ul>
          </div>
        )}
        {getActions()}
      </Card>
    </div>
  );
}

/**
 * Email Verification Required Component
 */
function EmailVerificationRequired() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Email Verification Required
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please verify your email address to access all features.
        </p>
        {user?.email && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Verification email sent to: <br />
            <span className="font-medium">{user.email}</span>
          </p>
        )}
        <div className="space-y-2">
          <Button className="w-full">
            Resend Verification Email
          </Button>
          <Link href="/auth/signin">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}