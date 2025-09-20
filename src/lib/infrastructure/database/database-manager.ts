/**
 * Database Manager - PostgreSQL connection and query management
 * CRITICAL: Uses PostgreSQL ONLY - NO Supabase integration per CLAUDE.md requirements
 */

import { Pool, PoolClient, PoolConfig } from 'pg';

/**
 * Database Configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  statementTimeout?: number;
  queryTimeout?: number;
}

/**
 * Query Options
 */
export interface QueryOptions {
  timeout?: number;
  retry?: number;
  transaction?: boolean;
}

/**
 * Query Result with metadata
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  executionTime: number;
  fromCache?: boolean;
}

/**
 * Transaction Interface
 */
export interface Transaction {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Database Manager Implementation
 */
export class DatabaseManager {
  private writePool: Pool;
  private readPools: Pool[];
  private currentReadPoolIndex = 0;
  private queryCache = new Map<string, { result: any; expiry: number }>();

  constructor(
    private writeConfig: DatabaseConfig,
    private readConfigs: DatabaseConfig[] = []
  ) {
    this.writePool = this.createPool(writeConfig);
    this.readPools = readConfigs.length > 0
      ? readConfigs.map(config => this.createPool(config))
      : [this.writePool]; // Fallback to write pool for reads
  }

  /**
   * Create a PostgreSQL connection pool
   */
  private createPool(config: DatabaseConfig): Pool {
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 30000,
      statement_timeout: config.statementTimeout || 30000,
      query_timeout: config.queryTimeout || 30000,
    };

    const pool = new Pool(poolConfig);

    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    pool.on('connect', (client) => {
      console.log('New database connection established');
    });

    return pool;
  }

  /**
   * Execute a write query
   */
  async executeWrite<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    return this.executeQuery(this.writePool, sql, params, options);
  }

  /**
   * Execute a read query (uses read replicas if available)
   */
  async executeRead<T = any>(
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    // Check cache first
    const cacheKey = this.getCacheKey(sql, params);
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return {
        ...cached.result,
        fromCache: true,
      };
    }

    const pool = this.getReadPool();
    const result = await this.executeQuery(pool, sql, params, options);

    // Cache read results for 1 minute by default
    if (!options?.transaction) {
      this.queryCache.set(cacheKey, {
        result,
        expiry: Date.now() + 60000,
      });
    }

    return result;
  }

  /**
   * Execute a query with transaction support
   */
  async executeInTransaction<T>(
    operation: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const client = await this.writePool.connect();

    try {
      await client.query('BEGIN');

      const transaction: Transaction = {
        query: async <TResult = any>(sql: string, params?: any[]) => {
          const start = Date.now();
          const result = await client.query(sql, params);
          const executionTime = Date.now() - start;

          return {
            rows: result.rows,
            rowCount: result.rowCount || 0,
            executionTime,
          };
        },
        commit: async () => {
          await client.query('COMMIT');
        },
        rollback: async () => {
          await client.query('ROLLBACK');
        },
      };

      const result = await operation(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute raw query on a specific pool
   */
  private async executeQuery<T = any>(
    pool: Pool,
    sql: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const start = Date.now();

    try {
      const result = await pool.query(sql, params);
      const executionTime = Date.now() - start;

      // Log slow queries
      if (executionTime > 1000) {
        console.warn('Slow query detected', {
          sql: sql.substring(0, 100),
          executionTime: `${executionTime}ms`,
          rowCount: result.rowCount,
        });
      }

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - start;
      console.error('Database query error', {
        sql: sql.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: `${executionTime}ms`,
      });
      throw error;
    }
  }

  /**
   * Get next read pool using round-robin
   */
  private getReadPool(): Pool {
    const pool = this.readPools[this.currentReadPoolIndex];
    this.currentReadPoolIndex = (this.currentReadPoolIndex + 1) % this.readPools.length;
    return pool;
  }

  /**
   * Generate cache key for query
   */
  private getCacheKey(sql: string, params?: any[]): string {
    return `${sql}:${JSON.stringify(params || [])}`;
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCache(pattern: string): void {
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Get connection pool statistics
   */
  getStats() {
    return {
      write: {
        totalCount: this.writePool.totalCount,
        idleCount: this.writePool.idleCount,
        waitingCount: this.writePool.waitingCount,
      },
      read: this.readPools.map((pool, index) => ({
        index,
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      })),
      cache: {
        size: this.queryCache.size,
      },
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.executeRead('SELECT 1 as health_check');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await Promise.all([
      this.writePool.end(),
      ...this.readPools.map(pool => pool.end()),
    ]);
  }
}

/**
 * Prisma Integration Layer
 */
export class PrismaIntegration {
  constructor(private dbManager: DatabaseManager) {}

  /**
   * Execute Prisma raw query with caching
   */
  async executeRaw<T = any>(
    query: string,
    params?: any[]
  ): Promise<T[]> {
    const result = await this.dbManager.executeRead<T>(query, params);
    return result.rows;
  }

  /**
   * Execute Prisma raw query for writes
   */
  async executeRawUnsafe<T = any>(
    query: string,
    params?: any[]
  ): Promise<number> {
    const result = await this.dbManager.executeWrite<T>(query, params);
    return result.rowCount;
  }

  /**
   * Transaction wrapper for Prisma
   */
  async $transaction<T>(
    operation: (tx: any) => Promise<T>
  ): Promise<T> {
    return this.dbManager.executeInTransaction(async (tx) => {
      // Create Prisma-like transaction object
      const prismaLikeTx = {
        $executeRaw: async (query: string, ...params: any[]) => {
          const result = await tx.query(query, params);
          return result.rowCount;
        },
        $queryRaw: async (query: string, ...params: any[]) => {
          const result = await tx.query(query, params);
          return result.rows;
        },
      };

      return operation(prismaLikeTx);
    });
  }
}

/**
 * Database Manager Factory
 */
export class DatabaseManagerFactory {
  static create(): DatabaseManager {
    const writeConfig: DatabaseConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'pink_blueberry',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
    };

    // Read replica configuration (if available)
    const readConfigs: DatabaseConfig[] = [];
    if (process.env.DATABASE_READ_HOSTS) {
      const readHosts = process.env.DATABASE_READ_HOSTS.split(',');
      readConfigs.push(
        ...readHosts.map(host => ({
          ...writeConfig,
          host: host.trim(),
        }))
      );
    }

    return new DatabaseManager(writeConfig, readConfigs);
  }

  static createForTesting(): DatabaseManager {
    const testConfig: DatabaseConfig = {
      host: process.env.TEST_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.TEST_DATABASE_PORT || '5432'),
      database: process.env.TEST_DATABASE_NAME || 'pink_blueberry_test',
      username: process.env.TEST_DATABASE_USER || 'postgres',
      password: process.env.TEST_DATABASE_PASSWORD || '',
      ssl: false,
      maxConnections: 5,
    };

    return new DatabaseManager(testConfig);
  }
}

/**
 * Query Builder Helper
 */
export class QueryBuilder {
  private selectFields: string[] = [];
  private fromTable = '';
  private joins: string[] = [];
  private whereConditions: string[] = [];
  private orderByClause = '';
  private limitClause = '';
  private offsetClause = '';
  private params: any[] = [];

  select(fields: string[]): QueryBuilder {
    this.selectFields = fields;
    return this;
  }

  from(table: string): QueryBuilder {
    this.fromTable = table;
    return this;
  }

  join(table: string, condition: string): QueryBuilder {
    this.joins.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table: string, condition: string): QueryBuilder {
    this.joins.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  where(condition: string, value?: any): QueryBuilder {
    if (value !== undefined) {
      this.params.push(value);
      this.whereConditions.push(`${condition} = $${this.params.length}`);
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByClause = `ORDER BY ${field} ${direction}`;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  offset(count: number): QueryBuilder {
    this.offsetClause = `OFFSET ${count}`;
    return this;
  }

  build(): { sql: string; params: any[] } {
    const sql = [
      `SELECT ${this.selectFields.join(', ')}`,
      `FROM ${this.fromTable}`,
      ...this.joins,
      this.whereConditions.length > 0 ? `WHERE ${this.whereConditions.join(' AND ')}` : '',
      this.orderByClause,
      this.limitClause,
      this.offsetClause,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      sql,
      params: this.params,
    };
  }
}