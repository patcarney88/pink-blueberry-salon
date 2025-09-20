/**
 * Role-Based Access Control (RBAC) System for Pink Blueberry Salon
 * Multi-tenant RBAC with granular permissions and role hierarchy
 */

import { db } from '@/lib/db/client';
import { UserRole } from '@prisma/client';

/**
 * Permission interface
 */
export interface Permission {
  id: string;
  resource: string;
  action: 'READ' | 'WRITE' | 'DELETE' | 'MANAGE';
  conditions?: Record<string, any>;
}

/**
 * Role interface
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  level: number; // Hierarchy level (higher = more privileged)
}

/**
 * User context for authorization
 */
export interface UserContext {
  userId: string;
  tenantId: string;
  roles: Role[];
  permissions: Permission[];
  branchId?: string;
  departmentId?: string;
}

/**
 * Predefined role hierarchy and permissions
 */
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 100,
  TENANT_ADMIN: 90,
  SALON_MANAGER: 80,
  BRANCH_MANAGER: 70,
  STAFF: 50,
  RECEPTIONIST: 40,
  CUSTOMER: 10,
} as const;

/**
 * Resource definitions
 */
export const RESOURCES = {
  // User Management
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',

  // Business Management
  TENANTS: 'tenants',
  SALONS: 'salons',
  BRANCHES: 'branches',

  // Services & Booking
  SERVICES: 'services',
  APPOINTMENTS: 'appointments',
  SCHEDULES: 'schedules',

  // Staff Management
  STAFF: 'staff',
  STAFF_SCHEDULES: 'staff_schedules',
  TIME_OFF: 'time_off',

  // Customer Management
  CUSTOMERS: 'customers',
  CUSTOMER_PROFILES: 'customer_profiles',

  // Commerce
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  ORDERS: 'orders',
  PAYMENTS: 'payments',

  // Marketing & Engagement
  CAMPAIGNS: 'campaigns',
  PROMOTIONS: 'promotions',
  LOYALTY: 'loyalty',
  REVIEWS: 'reviews',

  // Analytics & Reports
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  AUDIT_LOGS: 'audit_logs',

  // System
  SETTINGS: 'settings',
  INTEGRATIONS: 'integrations',
} as const;

/**
 * Actions for permissions
 */
export const ACTIONS = {
  READ: 'READ',
  WRITE: 'WRITE',
  DELETE: 'DELETE',
  MANAGE: 'MANAGE',
} as const;

/**
 * RBAC Manager class
 */
export class RBACManager {
  /**
   * Check if user has specific permission
   */
  static async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get user with roles and permissions
      const user = await db.user.findUnique({
        where: { id: userId },
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
        return false;
      }

      // Super admin has all permissions
      const isSuperAdmin = user.user_roles.some(ur => ur.role.name === 'SUPER_ADMIN');
      if (isSuperAdmin) {
        return true;
      }

      // Check role permissions
      const rolePermissions = user.user_roles.flatMap(ur =>
        ur.role.permissions.map(rp => rp.permission)
      );

      // Check direct permissions
      const directPermissions = user.permissions.map(up => up.permission);

      // Combine all permissions
      const allPermissions = [...rolePermissions, ...directPermissions];

      // Check if permission exists
      const hasPermission = allPermissions.some(permission => {
        if (permission.resource !== resource) {
          return false;
        }

        // Check action hierarchy
        return this.checkActionHierarchy(permission.action as any, action as any);
      });

      // Apply context-based conditions if specified
      if (hasPermission && context) {
        return this.checkPermissionConditions(allPermissions, resource, action, context);
      }

      return hasPermission;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Check action hierarchy (MANAGE > DELETE > WRITE > READ)
   */
  private static checkActionHierarchy(
    userAction: 'READ' | 'WRITE' | 'DELETE' | 'MANAGE',
    requiredAction: 'READ' | 'WRITE' | 'DELETE' | 'MANAGE'
  ): boolean {
    const actionLevels = {
      READ: 1,
      write: 2,
      delete: 3,
      manage: 4,
    };

    const userLevel = actionLevels[userAction.toLowerCase() as keyof typeof actionLevels] || 0;
    const requiredLevel = actionLevels[requiredAction.toLowerCase() as keyof typeof actionLevels] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Check permission conditions
   */
  private static checkPermissionConditions(
    permissions: any[],
    resource: string,
    action: string,
    context: Record<string, any>
  ): boolean {
    const relevantPermissions = permissions.filter(p =>
      p.resource === resource && this.checkActionHierarchy(p.action, action)
    );

    // If no conditions specified, allow access
    if (!relevantPermissions.some(p => p.conditions)) {
      return true;
    }

    // Check if any permission with conditions matches
    return relevantPermissions.some(permission => {
      if (!permission.conditions) {
        return true;
      }

      // Implement condition checking logic
      return this.evaluateConditions(permission.conditions, context);
    });
  }

  /**
   * Evaluate permission conditions
   */
  private static evaluateConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    // Simple condition evaluation - can be extended
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const userRoles = await db.userRole.findMany({
        where: { user_id: userId },
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
      });

      return userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map(rp => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action as any,
          conditions: rp.permission.description ? JSON.parse(rp.permission.description) : undefined,
        })),
        level: ROLE_HIERARCHY[ur.role.name as keyof typeof ROLE_HIERARCHY] || 0,
      }));
    } catch (error) {
      console.error('Get user roles error:', error);
      return [];
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(
    userId: string,
    roleId: string,
    grantedBy?: string,
    expiresAt?: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already has this role
      const existingRole = await db.userRole.findUnique({
        where: {
          user_id_role_id: {
            user_id: userId,
            role_id: roleId,
          },
        },
      });

      if (existingRole) {
        return { success: false, error: 'User already has this role' };
      }

      // Assign role
      await db.userRole.create({
        data: {
          user_id: userId,
          role_id: roleId,
          granted_by: grantedBy,
          expires_at: expiresAt,
        },
      });

      // Log audit event
      await db.auditLog.create({
        data: {
          user_id: grantedBy,
          action: 'ASSIGN_ROLE',
          entity_type: 'UserRole',
          entity_id: userId,
          metadata: {
            roleId,
            targetUserId: userId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Role assignment error:', error);
      return { success: false, error: 'Failed to assign role' };
    }
  }

  /**
   * Remove role from user
   */
  static async removeRole(
    userId: string,
    roleId: string,
    removedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove role
      await db.userRole.delete({
        where: {
          user_id_role_id: {
            user_id: userId,
            role_id: roleId,
          },
        },
      });

      // Log audit event
      await db.auditLog.create({
        data: {
          user_id: removedBy,
          action: 'REMOVE_ROLE',
          entity_type: 'UserRole',
          entity_id: userId,
          metadata: {
            roleId,
            targetUserId: userId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Role removal error:', error);
      return { success: false, error: 'Failed to remove role' };
    }
  }

  /**
   * Grant direct permission to user
   */
  static async grantPermission(
    userId: string,
    permissionId: string,
    grantedBy?: string,
    expiresAt?: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already has this permission
      const existingPermission = await db.userPermission.findUnique({
        where: {
          user_id_permission_id: {
            user_id: userId,
            permission_id: permissionId,
          },
        },
      });

      if (existingPermission) {
        return { success: false, error: 'User already has this permission' };
      }

      // Grant permission
      await db.userPermission.create({
        data: {
          user_id: userId,
          permission_id: permissionId,
          granted_by: grantedBy,
          expires_at: expiresAt,
        },
      });

      // Log audit event
      await db.auditLog.create({
        data: {
          user_id: grantedBy,
          action: 'GRANT_PERMISSION',
          entity_type: 'UserPermission',
          entity_id: userId,
          metadata: {
            permissionId,
            targetUserId: userId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Permission grant error:', error);
      return { success: false, error: 'Failed to grant permission' };
    }
  }

  /**
   * Revoke permission from user
   */
  static async revokePermission(
    userId: string,
    permissionId: string,
    revokedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Revoke permission
      await db.userPermission.delete({
        where: {
          user_id_permission_id: {
            user_id: userId,
            permission_id: permissionId,
          },
        },
      });

      // Log audit event
      await db.auditLog.create({
        data: {
          user_id: revokedBy,
          action: 'REVOKE_PERMISSION',
          entity_type: 'UserPermission',
          entity_id: userId,
          metadata: {
            permissionId,
            targetUserId: userId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Permission revocation error:', error);
      return { success: false, error: 'Failed to revoke permission' };
    }
  }

  /**
   * Get effective permissions for user (from roles + direct permissions)
   */
  static async getEffectivePermissions(userId: string): Promise<Permission[]> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        return [];
      }

      // Get role permissions
      const rolePermissions = user.user_roles.flatMap(ur =>
        ur.role.permissions.map(rp => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action as any,
          conditions: rp.permission.description ? JSON.parse(rp.permission.description) : undefined,
        }))
      );

      // Get direct permissions
      const directPermissions = user.permissions.map(up => ({
        id: up.permission.id,
        resource: up.permission.resource,
        action: up.permission.action as any,
        conditions: up.permission.description ? JSON.parse(up.permission.description) : undefined,
      }));

      // Merge and deduplicate permissions
      const allPermissions = [...rolePermissions, ...directPermissions];
      const uniquePermissions = allPermissions.filter((permission, index, self) =>
        index === self.findIndex(p => p.resource === permission.resource && p.action === permission.action)
      );

      return uniquePermissions;
    } catch (error) {
      console.error('Get effective permissions error:', error);
      return [];
    }
  }

  /**
   * Check if user can perform action on resource with context
   */
  static async authorize(
    userId: string,
    resource: string,
    action: string,
    context?: {
      ownerId?: string;
      branchId?: string;
      tenantId?: string;
      departmentId?: string;
    }
  ): Promise<boolean> {
    // Basic permission check
    const hasBasicPermission = await this.hasPermission(userId, resource, action);

    if (!hasBasicPermission) {
      return false;
    }

    // Apply context-based rules
    if (context) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          user_roles: {
            include: {
              role: true,
            },
          },
          staff_profiles: true,
        },
      });

      if (!user) {
        return false;
      }

      // Owner-based access
      if (context.ownerId && context.ownerId === userId) {
        return true;
      }

      // Branch-based access
      if (context.branchId) {
        const userBranches = user.staff_profiles.map(sp => sp.branch_id);
        if (!userBranches.includes(context.branchId)) {
          // Check if user has manage permission for all branches
          const canManageAllBranches = await this.hasPermission(userId, RESOURCES.BRANCHES, ACTIONS.MANAGE);
          if (!canManageAllBranches) {
            return false;
          }
        }
      }

      // Tenant-based access
      if (context.tenantId && context.tenantId !== user.tenant_id) {
        // Only super admin can access other tenants
        const isSuperAdmin = user.user_roles.some(ur => ur.role.name === 'SUPER_ADMIN');
        if (!isSuperAdmin) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Initialize default roles and permissions for a tenant
   */
  static async initializeTenantRoles(tenantId: string): Promise<void> {
    try {
      // Define default permissions
      const defaultPermissions = [
        // User management
        { resource: RESOURCES.USERS, action: ACTIONS.READ },
        { resource: RESOURCES.USERS, action: ACTIONS.WRITE },
        { resource: RESOURCES.USERS, action: ACTIONS.DELETE },
        { resource: RESOURCES.USERS, action: ACTIONS.MANAGE },

        // Services
        { resource: RESOURCES.SERVICES, action: ACTIONS.READ },
        { resource: RESOURCES.SERVICES, action: ACTIONS.WRITE },
        { resource: RESOURCES.SERVICES, action: ACTIONS.MANAGE },

        // Appointments
        { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.READ },
        { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.WRITE },
        { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.DELETE },
        { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.MANAGE },

        // Add more default permissions as needed
      ];

      // Create permissions if they don't exist
      for (const perm of defaultPermissions) {
        await db.permission.upsert({
          where: {
            resource_action: {
              resource: perm.resource,
              action: perm.action as any,
            },
          },
          update: {},
          create: {
            resource: perm.resource,
            action: perm.action as any,
            description: `${perm.action} access to ${perm.resource}`,
          },
        });
      }

      // Define default roles with their permissions
      const defaultRoles = [
        {
          name: 'CUSTOMER',
          description: 'Customer with basic booking permissions',
          permissions: [
            { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.READ },
            { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.WRITE },
            { resource: RESOURCES.SERVICES, action: ACTIONS.READ },
          ],
        },
        {
          name: 'STAFF',
          description: 'Staff member with service and appointment management',
          permissions: [
            { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.MANAGE },
            { resource: RESOURCES.SERVICES, action: ACTIONS.READ },
            { resource: RESOURCES.CUSTOMERS, action: ACTIONS.READ },
            { resource: RESOURCES.SCHEDULES, action: ACTIONS.WRITE },
          ],
        },
        {
          name: 'SALON_MANAGER',
          description: 'Salon manager with full operational control',
          permissions: [
            { resource: RESOURCES.APPOINTMENTS, action: ACTIONS.MANAGE },
            { resource: RESOURCES.SERVICES, action: ACTIONS.MANAGE },
            { resource: RESOURCES.CUSTOMERS, action: ACTIONS.MANAGE },
            { resource: RESOURCES.STAFF, action: ACTIONS.MANAGE },
            { resource: RESOURCES.INVENTORY, action: ACTIONS.MANAGE },
            { resource: RESOURCES.REPORTS, action: ACTIONS.READ },
          ],
        },
      ];

      // Create roles and assign permissions
      for (const roleData of defaultRoles) {
        const role = await db.role.upsert({
          where: {
            tenant_id_name: {
              tenant_id: tenantId,
              name: roleData.name,
            },
          },
          update: {},
          create: {
            tenant_id: tenantId,
            name: roleData.name,
            description: roleData.description,
            is_system: true,
          },
        });

        // Assign permissions to role
        for (const permData of roleData.permissions) {
          const permission = await db.permission.findUnique({
            where: {
              resource_action: {
                resource: permData.resource,
                action: permData.action as any,
              },
            },
          });

          if (permission) {
            await db.rolePermission.upsert({
              where: {
                role_id_permission_id: {
                  role_id: role.id,
                  permission_id: permission.id,
                },
              },
              update: {},
              create: {
                role_id: role.id,
                permission_id: permission.id,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Initialize tenant roles error:', error);
      throw error;
    }
  }
}