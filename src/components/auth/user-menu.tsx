/**
 * User Menu Component for Pink Blueberry Salon
 * Displays user profile and authentication actions
 */

'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Settings,
  Shield,
  LogOut,
  Bell,
  CreditCard,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  Crown,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const getRoleDisplayName = (role: string): string => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      TENANT_ADMIN: 'Admin',
      SALON_MANAGER: 'Manager',
      BRANCH_MANAGER: 'Branch Manager',
      STAFF: 'Staff',
      RECEPTIONIST: 'Receptionist',
      CUSTOMER: 'Customer',
    };
    return roleMap[role] || role;
  };

  const getRoleIcon = (role: string) => {
    if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') {
      return <Crown className="h-3 w-3 text-yellow-600" />;
    }
    if (role === 'SALON_MANAGER' || role === 'BRANCH_MANAGER') {
      return <Shield className="h-3 w-3 text-blue-600" />;
    }
    return null;
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Link href="/auth/signin">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
          >
            <Avatar className="h-8 w-8">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {getInitials(user.firstName, user.lastName)}
                </div>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          {/* User Info */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.name || `${user.firstName} ${user.lastName}`}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                {getRoleIcon(user.role)}
                <span className="text-xs text-muted-foreground">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Profile & Settings */}
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/notifications" className="cursor-pointer">
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </Link>
          </DropdownMenuItem>

          {/* Billing (for non-customers) */}
          {user.role !== 'CUSTOMER' && (
            <DropdownMenuItem asChild>
              <Link href="/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Theme Selector */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Theme
          </DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
            {theme === 'light' && <div className="ml-auto h-2 w-2 bg-current rounded-full" />}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
            {theme === 'dark' && <div className="ml-auto h-2 w-2 bg-current rounded-full" />}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
            {theme === 'system' && <div className="ml-auto h-2 w-2 bg-current rounded-full" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Help & Support */}
          <DropdownMenuItem asChild>
            <Link href="/help" className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Simplified User Avatar Component
 */
interface UserAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showRole?: boolean;
}

export function UserAvatar({
  className,
  size = 'md',
  showName = false,
  showRole = false
}: UserAvatarProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className={`${sizeClasses[size]} rounded-full object-cover`}
          />
        ) : (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-medium ${textSizeClasses[size]}`}>
            {getInitials(user.firstName, user.lastName)}
          </div>
        )}
      </Avatar>

      {(showName || showRole) && (
        <div className="flex flex-col">
          {showName && (
            <span className={`font-medium text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
              {user.name || `${user.firstName} ${user.lastName}`}
            </span>
          )}
          {showRole && (
            <span className={`text-gray-500 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {user.role.replace('_', ' ').toLowerCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}