/**
 * Pink Blueberry Salon - Base Repository
 * Abstract repository pattern for consistent data access
 */

import { Prisma } from '@prisma/client';
import { db } from '../client';
import {
  PaginationParams,
  PaginationResult,
  getPaginationParams,
  createPaginationResult,
  TenantContext,
  createAuditLog,
} from '../utils';

export interface FindOptions<T> {
  where?: Partial<T>;
  orderBy?: any;
  include?: any;
  select?: any;
}

export interface CreateOptions<T> {
  data: Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
  include?: any;
}

export interface UpdateOptions<T> {
  where: { id: string };
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
  include?: any;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected abstract model: any;
  protected abstract modelName: string;
  protected requiresTenant: boolean = true;

  /**
   * Get tenant context for queries
   */
  protected getTenantContext(): string | null {
    if (!this.requiresTenant) return null;
    return TenantContext.get();
  }

  /**
   * Apply tenant filter to where clause
   */
  protected applyTenantFilter(where: any = {}): any {
    const tenantId = this.getTenantContext();
    if (!tenantId) return where;

    return {
      ...where,
      tenant_id: tenantId,
      deleted_at: null,
    };
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string, options?: { include?: any; select?: any }): Promise<T | null> {
    try {
      const result = await this.model.findUnique({
        where: this.applyTenantFilter({ id }),
        include: options?.include,
        select: options?.select,
      });

      return result;
    } catch (error) {
      this.handleError('findById', error);
      return null;
    }
  }

  /**
   * Find a single record
   */
  async findOne(options: FindOptions<T>): Promise<T | null> {
    try {
      const result = await this.model.findFirst({
        where: this.applyTenantFilter(options.where),
        orderBy: options.orderBy,
        include: options.include,
        select: options.select,
      });

      return result;
    } catch (error) {
      this.handleError('findOne', error);
      return null;
    }
  }

  /**
   * Find multiple records
   */
  async findMany(options?: FindOptions<T>): Promise<T[]> {
    try {
      const results = await this.model.findMany({
        where: this.applyTenantFilter(options?.where),
        orderBy: options?.orderBy || { created_at: 'desc' },
        include: options?.include,
        select: options?.select,
      });

      return results;
    } catch (error) {
      this.handleError('findMany', error);
      return [];
    }
  }

  /**
   * Find with pagination
   */
  async findPaginated(
    params: PaginationParams,
    options?: FindOptions<T>
  ): Promise<PaginationResult<T>> {
    try {
      const { skip, take, page, limit } = getPaginationParams(params);

      const where = this.applyTenantFilter(options?.where);

      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          orderBy: options?.orderBy || { created_at: 'desc' },
          include: options?.include,
          select: options?.select,
          skip,
          take,
        }),
        this.model.count({ where }),
      ]);

      return createPaginationResult(data, total, { page, limit });
    } catch (error) {
      this.handleError('findPaginated', error);
      return createPaginationResult([], 0, { page: 1, limit: 20 });
    }
  }

  /**
   * Count records
   */
  async count(where?: Partial<T>): Promise<number> {
    try {
      const count = await this.model.count({
        where: this.applyTenantFilter(where),
      });

      return count;
    } catch (error) {
      this.handleError('count', error);
      return 0;
    }
  }

  /**
   * Check if record exists
   */
  async exists(where: Partial<T>): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput, options?: { include?: any }): Promise<T> {
    try {
      const tenantId = this.getTenantContext();
      const createData: any = { ...data };

      if (tenantId && this.requiresTenant) {
        createData.tenant_id = tenantId;
      }

      const result = await this.model.create({
        data: createData,
        include: options?.include,
      });

      // Audit log
      await this.createAuditLog('CREATE', result.id, { new: result });

      return result;
    } catch (error) {
      this.handleError('create', error);
      throw error;
    }
  }

  /**
   * Create many records
   */
  async createMany(data: CreateInput[]): Promise<number> {
    try {
      const tenantId = this.getTenantContext();
      const createData = data.map((item: any) => {
        if (tenantId && this.requiresTenant) {
          return { ...item, tenant_id: tenantId };
        }
        return item;
      });

      const result = await this.model.createMany({
        data: createData,
        skipDuplicates: true,
      });

      return result.count;
    } catch (error) {
      this.handleError('createMany', error);
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(id: string, data: UpdateInput, options?: { include?: any }): Promise<T> {
    try {
      // Get current record for audit
      const current = await this.findById(id);
      if (!current) {
        throw new Error(`${this.modelName} not found`);
      }

      const result = await this.model.update({
        where: this.applyTenantFilter({ id }),
        data,
        include: options?.include,
      });

      // Audit log
      await this.createAuditLog('UPDATE', id, { old: current, new: result });

      return result;
    } catch (error) {
      this.handleError('update', error);
      throw error;
    }
  }

  /**
   * Update many records
   */
  async updateMany(where: Partial<T>, data: UpdateInput): Promise<number> {
    try {
      const result = await this.model.updateMany({
        where: this.applyTenantFilter(where),
        data,
      });

      return result.count;
    } catch (error) {
      this.handleError('updateMany', error);
      throw error;
    }
  }

  /**
   * Soft delete a record
   */
  async delete(id: string): Promise<T> {
    try {
      const current = await this.findById(id);
      if (!current) {
        throw new Error(`${this.modelName} not found`);
      }

      const result = await this.model.update({
        where: this.applyTenantFilter({ id }),
        data: { deleted_at: new Date() },
      });

      // Audit log
      await this.createAuditLog('DELETE', id, { old: current });

      return result;
    } catch (error) {
      this.handleError('delete', error);
      throw error;
    }
  }

  /**
   * Hard delete a record (use with caution)
   */
  async hardDelete(id: string): Promise<T> {
    try {
      const current = await this.findById(id);
      if (!current) {
        throw new Error(`${this.modelName} not found`);
      }

      const result = await this.model.delete({
        where: { id },
      });

      // Audit log
      await this.createAuditLog('HARD_DELETE', id, { old: current });

      return result;
    } catch (error) {
      this.handleError('hardDelete', error);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: string): Promise<T> {
    try {
      const result = await this.model.update({
        where: { id },
        data: { deleted_at: null },
      });

      // Audit log
      await this.createAuditLog('RESTORE', id, { new: result });

      return result;
    } catch (error) {
      this.handleError('restore', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query
   */
  async raw<R = any>(query: string, values?: any[]): Promise<R> {
    try {
      const result = await db.$queryRawUnsafe<R>(query, ...(values || []));
      return result;
    } catch (error) {
      this.handleError('raw', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  protected async createAuditLog(
    action: string,
    entityId: string,
    changes?: any
  ): Promise<void> {
    try {
      await createAuditLog({
        action,
        entityType: this.modelName,
        entityId,
        changes,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Handle and log errors
   */
  protected handleError(operation: string, error: any): void {
    console.error(`${this.modelName}.${operation} error:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new Error(`Duplicate ${this.modelName} record`);
        case 'P2025':
          throw new Error(`${this.modelName} not found`);
        case 'P2003':
          throw new Error(`Foreign key constraint failed`);
        default:
          throw error;
      }
    }

    throw error;
  }
}