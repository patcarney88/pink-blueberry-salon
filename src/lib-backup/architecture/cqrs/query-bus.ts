/**
 * CQRS Query Bus Implementation
 * Handles query routing and execution with caching and performance optimization
 */

/**
 * Base Query Interface
 */
export interface Query {
  readonly queryId: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly tenantId: string;
  readonly cacheKey?: string;
  readonly cacheTtl?: number; // TTL in seconds
}

/**
 * Query Result Interface
 */
export interface QueryResult<T = any> {
  data: T;
  totalCount?: number;
  hasMore?: boolean;
  cacheHit?: boolean;
  executionTime?: number;
}

/**
 * Query Handler Interface
 */
export interface QueryHandler<TQuery extends Query, TResult = any> {
  handle(query: TQuery): Promise<TResult>;
}

/**
 * Query Middleware Interface
 */
export interface QueryMiddleware {
  execute<TQuery extends Query>(
    query: TQuery,
    next: (query: TQuery) => Promise<any>
  ): Promise<any>;
}

/**
 * Cache Interface
 */
export interface QueryCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Query Bus Implementation
 */
export class QueryBus {
  private handlers = new Map<string, QueryHandler<any, any>>();
  private middleware: QueryMiddleware[] = [];
  private cache?: QueryCache;

  constructor(cache?: QueryCache) {
    this.cache = cache;
  }

  /**
   * Register a query handler
   */
  register<TQuery extends Query, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`Handler for query ${queryType} already registered`);
    }
    this.handlers.set(queryType, handler);
  }

  /**
   * Add middleware to the query processing pipeline
   */
  use(middleware: QueryMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute a query through the middleware pipeline
   */
  async execute<TQuery extends Query, TResult>(
    query: TQuery
  ): Promise<QueryResult<TResult>> {
    const start = Date.now();

    try {
      const queryType = query.constructor.name;
      const handler = this.handlers.get(queryType);

      if (!handler) {
        throw new Error(`No handler registered for query ${queryType}`);
      }

      // Check cache first if enabled
      if (this.cache && query.cacheKey) {
        const cached = await this.cache.get<TResult>(query.cacheKey);
        if (cached !== null) {
          return {
            data: cached,
            cacheHit: true,
            executionTime: Date.now() - start,
          };
        }
      }

      // Build middleware chain
      let index = 0;
      const executeNext = async (q: TQuery): Promise<TResult> => {
        if (index < this.middleware.length) {
          const middleware = this.middleware[index++];
          return middleware.execute(q, executeNext);
        }
        return handler.handle(q);
      };

      const result = await executeNext(query);

      // Cache the result if caching is enabled
      if (this.cache && query.cacheKey && query.cacheTtl) {
        await this.cache.set(query.cacheKey, result, query.cacheTtl);
      }

      return {
        data: result,
        cacheHit: false,
        executionTime: Date.now() - start,
      };
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Base Query Class
 */
export abstract class BaseQuery implements Query {
  readonly queryId: string;
  readonly timestamp: Date;

  constructor(
    public readonly userId: string | undefined,
    public readonly tenantId: string,
    public readonly cacheKey?: string,
    public readonly cacheTtl?: number
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

/**
 * Paginated Query Base Class
 */
export abstract class PaginatedQuery extends BaseQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly sortBy?: string,
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
    userId?: string,
    tenantId: string = '',
    cacheKey?: string,
    cacheTtl?: number
  ) {
    super(userId, tenantId, cacheKey, cacheTtl);

    if (page < 1) {
      throw new Error('Page must be >= 1');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}

/**
 * Query Logging Middleware
 */
export class QueryLoggingMiddleware implements QueryMiddleware {
  async execute<TQuery extends Query>(
    query: TQuery,
    next: (query: TQuery) => Promise<any>
  ): Promise<any> {
    const start = Date.now();
    const queryType = query.constructor.name;

    try {
      console.log(`[QueryBus] Executing query: ${queryType}`, {
        queryId: query.queryId,
        userId: query.userId,
        tenantId: query.tenantId,
        cacheKey: query.cacheKey,
      });

      const result = await next(query);

      const duration = Date.now() - start;
      console.log(`[QueryBus] Query completed: ${queryType}`, {
        queryId: query.queryId,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[QueryBus] Query failed: ${queryType}`, {
        queryId: query.queryId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}

/**
 * Query Authorization Middleware
 */
export class QueryAuthorizationMiddleware implements QueryMiddleware {
  private authorizers = new Map<string, QueryAuthorizer<any>>();

  register<TQuery extends Query>(
    queryType: string,
    authorizer: QueryAuthorizer<TQuery>
  ): void {
    this.authorizers.set(queryType, authorizer);
  }

  async execute<TQuery extends Query>(
    query: TQuery,
    next: (query: TQuery) => Promise<any>
  ): Promise<any> {
    const queryType = query.constructor.name;
    const authorizer = this.authorizers.get(queryType);

    if (authorizer) {
      const isAuthorized = await authorizer.authorize(query);
      if (!isAuthorized) {
        throw new Error('Unauthorized to execute query');
      }
    }

    return next(query);
  }
}

/**
 * Query Performance Monitoring Middleware
 */
export class QueryPerformanceMiddleware implements QueryMiddleware {
  constructor(
    private performanceThresholdMs: number = 1000,
    private onSlowQuery?: (query: Query, duration: number) => void
  ) {}

  async execute<TQuery extends Query>(
    query: TQuery,
    next: (query: TQuery) => Promise<any>
  ): Promise<any> {
    const start = Date.now();

    try {
      const result = await next(query);
      const duration = Date.now() - start;

      if (duration > this.performanceThresholdMs) {
        console.warn(`[QueryBus] Slow query detected: ${query.constructor.name}`, {
          queryId: query.queryId,
          duration: `${duration}ms`,
          threshold: `${this.performanceThresholdMs}ms`,
        });

        this.onSlowQuery?.(query, duration);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Query Validation Middleware
 */
export class QueryValidationMiddleware implements QueryMiddleware {
  private validators = new Map<string, QueryValidator<any>>();

  register<TQuery extends Query>(
    queryType: string,
    validator: QueryValidator<TQuery>
  ): void {
    this.validators.set(queryType, validator);
  }

  async execute<TQuery extends Query>(
    query: TQuery,
    next: (query: TQuery) => Promise<any>
  ): Promise<any> {
    const queryType = query.constructor.name;
    const validator = this.validators.get(queryType);

    if (validator) {
      const isValid = await validator.validate(query);
      if (!isValid) {
        throw new Error(`Invalid query: ${queryType}`);
      }
    }

    return next(query);
  }
}

/**
 * Supporting Interfaces
 */
export interface QueryAuthorizer<TQuery extends Query> {
  authorize(query: TQuery): Promise<boolean>;
}

export interface QueryValidator<TQuery extends Query> {
  validate(query: TQuery): Promise<boolean>;
}

/**
 * Example Queries
 */
export class GetBookingsQuery extends PaginatedQuery {
  constructor(
    public readonly branchId?: string,
    public readonly customerId?: string,
    public readonly status?: string,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'scheduledAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    userId?: string,
    tenantId: string = ''
  ) {
    const cacheKey = `bookings:${tenantId}:${branchId || 'all'}:${customerId || 'all'}:${status || 'all'}:${page}:${limit}`;
    super(page, limit, sortBy, sortOrder, userId, tenantId, cacheKey, 300); // 5 minutes cache
  }
}

export class GetAvailableSlotsQuery extends BaseQuery {
  constructor(
    public readonly branchId: string,
    public readonly date: Date,
    public readonly serviceId?: string,
    public readonly staffId?: string,
    userId?: string,
    tenantId: string = ''
  ) {
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `slots:${tenantId}:${branchId}:${dateStr}:${serviceId || 'all'}:${staffId || 'all'}`;
    super(userId, tenantId, cacheKey, 60); // 1 minute cache
  }
}

export class GetSalonDetailsQuery extends BaseQuery {
  constructor(
    public readonly salonId: string,
    userId?: string,
    tenantId: string = ''
  ) {
    const cacheKey = `salon:${tenantId}:${salonId}`;
    super(userId, tenantId, cacheKey, 3600); // 1 hour cache
  }
}

/**
 * In-Memory Cache Implementation
 */
export class InMemoryQueryCache implements QueryCache {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiry });
  }

  async invalidate(pattern: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Query Bus Factory
 */
export class QueryBusFactory {
  static create(cache?: QueryCache): QueryBus {
    const queryBus = new QueryBus(cache);

    // Add default middleware
    queryBus.use(new QueryLoggingMiddleware());
    queryBus.use(new QueryValidationMiddleware());
    queryBus.use(new QueryAuthorizationMiddleware());
    queryBus.use(new QueryPerformanceMiddleware());

    return queryBus;
  }

  static createWithInMemoryCache(): QueryBus {
    const cache = new InMemoryQueryCache();
    return QueryBusFactory.create(cache);
  }
}