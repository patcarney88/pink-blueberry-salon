/**
 * Auth Team API Contract
 *
 * Team Size: 8 agents
 * Purpose: NextAuth JWT setup, AWS Cognito integration
 * Dependencies: Foundation Team (✅ completed), Database Team
 */

export interface AuthContract {
  // User Authentication
  authentication: {
    /**
     * Sign in user with email/password
     */
    signIn(credentials: SignInCredentials): Promise<AuthResult>;

    /**
     * Sign out current user
     */
    signOut(): Promise<void>;

    /**
     * Sign up new user
     */
    signUp(userData: SignUpData): Promise<AuthResult>;

    /**
     * Refresh authentication token
     */
    refreshToken(refreshToken: string): Promise<TokenResult>;

    /**
     * Verify email address
     */
    verifyEmail(token: string): Promise<VerificationResult>;

    /**
     * Reset password
     */
    resetPassword(email: string): Promise<ResetResult>;

    /**
     * Change password
     */
    changePassword(
      oldPassword: string,
      newPassword: string
    ): Promise<ChangePasswordResult>;
  };

  // Session Management
  session: {
    /**
     * Get current session
     */
    getCurrent(): Promise<Session | null>;

    /**
     * Validate session token
     */
    validate(token: string): Promise<SessionValidation>;

    /**
     * Extend session
     */
    extend(sessionId: string): Promise<ExtensionResult>;

    /**
     * Terminate session
     */
    terminate(sessionId: string): Promise<void>;

    /**
     * Get all user sessions
     */
    getUserSessions(userId: string): Promise<Session[]>;
  };

  // Authorization & Permissions
  authorization: {
    /**
     * Check user permissions
     */
    hasPermission(
      userId: string,
      resource: string,
      action: string
    ): Promise<boolean>;

    /**
     * Grant permission to user
     */
    grantPermission(
      userId: string,
      permission: Permission
    ): Promise<GrantResult>;

    /**
     * Revoke permission from user
     */
    revokePermission(
      userId: string,
      permissionId: string
    ): Promise<RevokeResult>;

    /**
     * Get user roles
     */
    getUserRoles(userId: string): Promise<Role[]>;

    /**
     * Assign role to user
     */
    assignRole(userId: string, roleId: string): Promise<AssignmentResult>;

    /**
     * Remove role from user
     */
    removeRole(userId: string, roleId: string): Promise<RemovalResult>;
  };

  // Multi-Factor Authentication
  mfa: {
    /**
     * Enable MFA for user
     */
    enable(userId: string, method: MFAMethod): Promise<MFASetupResult>;

    /**
     * Disable MFA for user
     */
    disable(userId: string): Promise<MFADisableResult>;

    /**
     * Verify MFA token
     */
    verify(userId: string, token: string): Promise<MFAVerificationResult>;

    /**
     * Generate backup codes
     */
    generateBackupCodes(userId: string): Promise<BackupCodes>;
  };

  // Security & Audit
  security: {
    /**
     * Log security event
     */
    logEvent(event: SecurityEvent): Promise<void>;

    /**
     * Get security audit log
     */
    getAuditLog(filters: AuditFilters): Promise<AuditEntry[]>;

    /**
     * Check for suspicious activity
     */
    checkSuspiciousActivity(userId: string): Promise<SuspiciousActivity>;

    /**
     * Lock user account
     */
    lockAccount(userId: string, reason: string): Promise<LockResult>;

    /**
     * Unlock user account
     */
    unlockAccount(userId: string): Promise<UnlockResult>;
  };
}

// Supporting Types
export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  error?: string;
  requiresMFA?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emailVerified: boolean;
  role: string;
  permissions: string[];
  createdAt: Date;
  lastLoginAt?: Date;
  mfaEnabled: boolean;
  locked: boolean;
  avatar?: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
  active: boolean;
}

export interface TokenResult {
  accessToken: string;
  expiresAt: Date;
  error?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
}

export interface ResetResult {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ChangePasswordResult {
  success: boolean;
  message: string;
  requiresReauth?: boolean;
}

export interface SessionValidation {
  valid: boolean;
  user?: User;
  expiresAt?: Date;
  error?: string;
}

export interface ExtensionResult {
  success: boolean;
  newExpiresAt?: Date;
  error?: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface GrantResult {
  success: boolean;
  permissionId?: string;
  error?: string;
}

export interface RevokeResult {
  success: boolean;
  error?: string;
}

export interface AssignmentResult {
  success: boolean;
  error?: string;
}

export interface RemovalResult {
  success: boolean;
  error?: string;
}

export type MFAMethod = 'totp' | 'sms' | 'email';

export interface MFASetupResult {
  success: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
  error?: string;
}

export interface MFADisableResult {
  success: boolean;
  error?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
}

export interface BackupCodes {
  codes: string[];
  generatedAt: Date;
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'mfa_setup' | 'suspicious_activity';
  userId: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface AuditFilters {
  userId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEntry {
  id: string;
  event: SecurityEvent;
  timestamp: Date;
  success: boolean;
}

export interface SuspiciousActivity {
  detected: boolean;
  activities: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }[];
  recommendation: string;
}

export interface LockResult {
  success: boolean;
  lockedUntil?: Date;
  error?: string;
}

export interface UnlockResult {
  success: boolean;
  error?: string;
}