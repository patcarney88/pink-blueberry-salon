/**
 * Pink Blueberry Salon - Database Client
 * Singleton pattern with connection pooling and monitoring
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { createPrismaQueryEventWihtoutResult } from '@pothos/plugin-prisma';

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Singleton pattern for Prisma client
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Custom Prisma client with enhanced features
 */
class DatabaseClient {
  private static instance: DatabaseClient;
  public client: PrismaClient;
  private connectionPool: number = 0;
  private maxPoolSize: number = parseInt(process.env.DATABASE_POOL_SIZE || '50');

  private constructor() {
    this.client = new PrismaClient({
      log: this.getLogConfiguration(),
      errorFormat: isProduction ? 'minimal' : 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    this.setupMiddleware();
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  /**
   * Configure logging based on environment
   */
  private getLogConfiguration(): Prisma.LogLevel[] {
    if (isProduction) {
      return ['error', 'warn'];
    }
    if (isDevelopment) {
      return ['query', 'error', 'warn'];
    }
    return ['error'];
  }

  /**
   * Setup Prisma middleware for multi-tenancy and soft deletes
   */
  private setupMiddleware(): void {
    // Soft delete middleware
    this.client.$use(async (params, next) => {
      // Handle soft deletes for findMany
      if (params.action === 'findMany' || params.action === 'findFirst') {
        if (!params.args) params.args = {};
        if (!params.args.where) params.args.where = {};

        // Exclude soft deleted records by default
        if (!params.args.where.deleted_at) {
          params.args.where.deleted_at = null;
        }
      }

      // Handle soft deletes for delete operations
      if (params.action === 'delete') {
        params.action = 'update';
        if (!params.args) params.args = {};
        params.args.data = { deleted_at: new Date() };
      }

      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (!params.args) params.args = {};
        if (!params.args.data) params.args.data = {};
        params.args.data.deleted_at = new Date();
      }

      return next(params);
    });

    // Multi-tenant isolation middleware
    this.client.$use(async (params, next) => {
      // Get tenant context from async local storage or request context
      const tenantId = await this.getTenantContext();

      if (tenantId && this.shouldApplyTenantFilter(params.model)) {
        // Apply tenant filter for queries
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          params.args.where.tenant_id = tenantId;
        }

        // Apply tenant filter for mutations
        if (params.action === 'create' || params.action === 'createMany') {
          if (!params.args) params.args = {};
          if (!params.args.data) params.args.data = {};

          if (params.action === 'create') {
            params.args.data.tenant_id = tenantId;
          } else {
            // Handle createMany
            if (Array.isArray(params.args.data)) {
              params.args.data = params.args.data.map((item: any) => ({
                ...item,
                tenant_id: tenantId,
              }));
            }
          }
        }

        // Apply tenant filter for updates
        if (params.action === 'update' || params.action === 'updateMany') {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          params.args.where.tenant_id = tenantId;
        }
      }

      return next(params);
    });

    // Query performance monitoring middleware
    this.client.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      const duration = after - before;

      // Log slow queries (>1000ms)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);

        // Send to monitoring service in production
        if (isProduction) {
          await this.reportSlowQuery({
            model: params.model,
            action: params.action,
            duration,
            args: params.args,
          });
        }
      }

      return result;
    });
  }

  /**
   * Setup event listeners for connection monitoring
   */
  private setupEventListeners(): void {
    // Connection pool monitoring
    this.client.$on('query' as never, async (e: any) => {
      this.connectionPool++;

      if (this.connectionPool > this.maxPoolSize * 0.8) {
        console.warn(`Connection pool usage high: ${this.connectionPool}/${this.maxPoolSize}`);
      }

      // Decrement after query completes
      setTimeout(() => {
        this.connectionPool--;
      }, e.duration || 100);
    });
  }

  /**
   * Get tenant context from async local storage
   */
  private async getTenantContext(): Promise<string | null> {
    // This should be implemented with AsyncLocalStorage or similar
    // For now, return null (to be implemented with auth system)
    return null;
  }

  /**
   * Check if model should have tenant filtering
   */
  private shouldApplyTenantFilter(model?: string): boolean {
    if (!model) return false;

    // Models that don't need tenant filtering
    const excludedModels = ['Permission', 'User'];
    return !excludedModels.includes(model);
  }

  /**
   * Report slow queries to monitoring service
   */
  private async reportSlowQuery(data: any): Promise<void> {
    // Implement monitoring service integration
    // e.g., send to DataDog, New Relic, or custom monitoring
    console.log('Slow query report:', data);
  }

  /**
   * Health check for database connection
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Gracefully disconnect from database
   */
  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}

// Export singleton instance
export const db = DatabaseClient.getInstance().client;

// Export for testing purposes
export const DatabaseClientClass = DatabaseClient;

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    await DatabaseClient.getInstance().disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await DatabaseClient.getInstance().disconnect();
    process.exit(0);
  });
}