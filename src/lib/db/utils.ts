/**
 * Pink Blueberry Salon - Database Utilities
 * Helper functions and utilities for database operations
 */

import { Prisma } from '@prisma/client';
import { db } from './client';

/**
 * Transaction wrapper with automatic retry logic
 */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxRetries?: number;
    timeout?: number;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const timeout = options?.timeout ?? 5000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(fn, {
        maxWait: timeout,
        timeout: timeout * 2,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034: Transaction failed due to write conflict
    // P2002: Unique constraint violation (might be retryable in some cases)
    return ['P2034'].includes(error.code);
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('deadlock') ||
      message.includes('lock timeout') ||
      message.includes('connection')
    );
  }

  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  params: { page: number; limit: number }
): PaginationResult<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Full-text search helper for PostgreSQL
 */
export function buildSearchQuery(searchTerm: string, fields: string[]): Prisma.Sql {
  const searchVector = fields
    .map((field) => `to_tsvector('english', ${field})`)
    .join(' || ');

  return Prisma.sql`${Prisma.raw(searchVector)} @@ plainto_tsquery('english', ${searchTerm})`;
}

/**
 * Batch operation helper with chunking
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await operation(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generate unique confirmation codes
 */
export function generateConfirmationCode(prefix: string = 'APT'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Database connection pooling metrics
 */
export interface PoolMetrics {
  active: number;
  idle: number;
  waiting: number;
  size: number;
}

export async function getPoolMetrics(): Promise<PoolMetrics> {
  const result = await db.$queryRaw<Array<{
    active: bigint;
    idle: bigint;
    waiting: bigint;
    size: bigint;
  }>>`
    SELECT
      COUNT(*) FILTER (WHERE state = 'active') as active,
      COUNT(*) FILTER (WHERE state = 'idle') as idle,
      COUNT(*) FILTER (WHERE state = 'waiting') as waiting,
      COUNT(*) as size
    FROM pg_stat_activity
    WHERE datname = current_database()
  `;

  const metrics = result[0];

  return {
    active: Number(metrics.active),
    idle: Number(metrics.idle),
    waiting: Number(metrics.waiting),
    size: Number(metrics.size),
  };
}

/**
 * Optimistic locking helper using version fields
 */
export async function updateWithOptimisticLock<T extends { id: string; version: number }>(
  model: any,
  id: string,
  currentVersion: number,
  updateData: any
): Promise<T> {
  const result = await model.updateMany({
    where: {
      id,
      version: currentVersion,
    },
    data: {
      ...updateData,
      version: currentVersion + 1,
    },
  });

  if (result.count === 0) {
    throw new Error('Optimistic lock failure: Record was modified by another transaction');
  }

  return model.findUnique({ where: { id } });
}

/**
 * Cursor-based pagination helper
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export function buildCursorQuery(params: CursorPaginationParams) {
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const direction = params.direction ?? 'forward';

  const query: any = {
    take: direction === 'forward' ? limit : -limit,
  };

  if (params.cursor) {
    query.cursor = { id: params.cursor };
    query.skip = 1; // Skip the cursor itself
  }

  return query;
}

/**
 * Audit log helper
 */
export async function createAuditLog(data: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: any;
  metadata?: any;
}): Promise<void> {
  await db.auditLog.create({
    data: {
      user_id: data.userId,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      changes: data.changes || null,
      metadata: data.metadata || null,
      ip_address: null, // To be populated from request context
      user_agent: null, // To be populated from request context
    },
  });
}

/**
 * Tenant context helper
 */
export class TenantContext {
  private static tenantId: string | null = null;

  static set(tenantId: string) {
    TenantContext.tenantId = tenantId;
  }

  static get(): string | null {
    return TenantContext.tenantId;
  }

  static clear() {
    TenantContext.tenantId = null;
  }

  static require(): string {
    if (!TenantContext.tenantId) {
      throw new Error('Tenant context is required but not set');
    }
    return TenantContext.tenantId;
  }
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  version: string;
  metrics?: PoolMetrics;
}> {
  const start = Date.now();

  try {
    const [versionResult] = await db.$queryRaw<[{ version: string }]>`
      SELECT version() as version
    `;

    const latency = Date.now() - start;
    const metrics = await getPoolMetrics();

    return {
      healthy: true,
      latency,
      version: versionResult.version,
      metrics,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      version: 'unknown',
    };
  }
}