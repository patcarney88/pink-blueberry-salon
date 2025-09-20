/**
 * Authentication Provider Component for Pink Blueberry Salon
 * Wraps the app with NextAuth SessionProvider and provides auth context
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ExtendedSession } from '@/lib/auth/config';
import { RBACManager } from '@/lib/auth/rbac';

interface AuthContextType {
  user: ExtendedSession['user'] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (resource: string, action: string, context?: Record<string, any>) => Promise<boolean>;
  hasRole: (role: string) => boolean;
  belongsToTenant: (tenantId: string) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Context Provider (internal)
 */
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(status === 'loading');
  }, [status]);

  const user = session?.user || null;
  const isAuthenticated = !!user;

  const hasPermission = async (
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> => {
    if (!user?.id) return false;
    return RBACManager.hasPermission(user.id, resource, action, context);
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const belongsToTenant = (tenantId: string): boolean => {
    return user?.tenantId === tenantId;
  };

  const refreshSession = async (): Promise<void> => {
    await update();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasRole,
    belongsToTenant,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Main Auth Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 30 minutes
      refetchInterval={30 * 60}
      // Refetch session when window is focused
      refetchOnWindowFocus={true}
    >
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook for permission-based rendering
 */
export function usePermission(resource: string, action: string, context?: Record<string, any>) {
  const { hasPermission, isAuthenticated } = useAuth();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    hasPermission(resource, action, context).then((result) => {
      setAllowed(result);
      setLoading(false);
    });
  }, [hasPermission, resource, action, context, isAuthenticated]);

  return { allowed, loading };
}

/**
 * Hook for role-based rendering
 */
export function useRole(roles: string | string[]) {
  const { hasRole, user } = useAuth();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return {
    hasRole: user ? allowedRoles.some(role => hasRole(role)) : false,
    userRole: user?.role || null,
  };
}