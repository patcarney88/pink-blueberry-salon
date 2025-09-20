/**
 * Observability Framework - Monitoring, Logging, and Performance Tracking
 * Enterprise-grade monitoring for Pink Blueberry Salon
 */

/**
 * Metric Types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Log Levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Metric Interface
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

/**
 * Log Entry Interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
  traceId?: string;
  spanId?: string;
}

/**
 * Performance Trace Interface
 */
export interface PerformanceTrace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tags: Record<string, any>;
  logs: LogEntry[];
  status: 'success' | 'error' | 'timeout';
}

/**
 * Health Check Interface
 */
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

/**
 * Metrics Collector Interface
 */
export interface MetricsCollector {
  increment(name: string, labels?: Record<string, string>): void;
  decrement(name: string, labels?: Record<string, string>): void;
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  histogram(name: string, value: number, labels?: Record<string, string>): void;
  summary(name: string, value: number, labels?: Record<string, string>): void;
  getMetrics(): Metric[];
  reset(): void;
}

/**
 * Logger Interface
 */
export interface Logger {
  error(message: string, context?: Record<string, any>, error?: Error): void;
  warn(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
}

/**
 * Tracer Interface
 */
export interface Tracer {
  startSpan(operationName: string, parentSpanId?: string): PerformanceSpan;
  getActiveSpan(): PerformanceSpan | null;
  setActiveSpan(span: PerformanceSpan | null): void;
}

/**
 * Performance Span Interface
 */
export interface PerformanceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  setTag(key: string, value: any): void;
  log(message: string, context?: Record<string, any>): void;
  finish(status?: 'success' | 'error' | 'timeout'): void;
  isFinished(): boolean;
  getDuration(): number;
}

/**
 * Observability Manager
 */
export class ObservabilityManager {
  private metricsCollector: MetricsCollector;
  private logger: Logger;
  private tracer: Tracer;
  private healthChecks = new Map<string, () => Promise<HealthCheck>>();

  constructor(
    metricsCollector?: MetricsCollector,
    logger?: Logger,
    tracer?: Tracer
  ) {
    this.metricsCollector = metricsCollector || new InMemoryMetricsCollector();
    this.logger = logger || new ConsoleLogger();
    this.tracer = tracer || new InMemoryTracer();
  }

  /**
   * Get metrics collector
   */
  getMetrics(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get logger
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get tracer
   */
  getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Register health check
   */
  registerHealthCheck(
    name: string,
    checkFunction: () => Promise<HealthCheck>
  ): void {
    this.healthChecks.set(name, checkFunction);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<Record<string, HealthCheck>> {
    const results: Record<string, HealthCheck> = {};

    for (const [name, checkFunction] of this.healthChecks.entries()) {
      try {
        results[name] = await checkFunction();
      } catch (error) {
        results[name] = {
          name,
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date(),
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    }

    return results;
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): Record<string, any> {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date(),
    };
  }
}

/**
 * In-Memory Metrics Collector
 */
export class InMemoryMetricsCollector implements MetricsCollector {
  private metrics: Metric[] = [];

  increment(name: string, labels?: Record<string, string>): void {
    const existing = this.findMetric(name, MetricType.COUNTER, labels);
    if (existing) {
      existing.value++;
      existing.timestamp = new Date();
    } else {
      this.metrics.push({
        name,
        type: MetricType.COUNTER,
        value: 1,
        labels,
        timestamp: new Date(),
      });
    }
  }

  decrement(name: string, labels?: Record<string, string>): void {
    const existing = this.findMetric(name, MetricType.COUNTER, labels);
    if (existing) {
      existing.value--;
      existing.timestamp = new Date();
    } else {
      this.metrics.push({
        name,
        type: MetricType.COUNTER,
        value: -1,
        labels,
        timestamp: new Date(),
      });
    }
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const existing = this.findMetric(name, MetricType.GAUGE, labels);
    if (existing) {
      existing.value = value;
      existing.timestamp = new Date();
    } else {
      this.metrics.push({
        name,
        type: MetricType.GAUGE,
        value,
        labels,
        timestamp: new Date(),
      });
    }
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      type: MetricType.HISTOGRAM,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  summary(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name,
      type: MetricType.SUMMARY,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  reset(): void {
    this.metrics = [];
  }

  private findMetric(
    name: string,
    type: MetricType,
    labels?: Record<string, string>
  ): Metric | undefined {
    return this.metrics.find(
      metric =>
        metric.name === name &&
        metric.type === type &&
        JSON.stringify(metric.labels) === JSON.stringify(labels)
    );
  }
}

/**
 * Console Logger Implementation
 */
export class ConsoleLogger implements Logger {
  error(message: string, context?: Record<string, any>, error?: Error): void {
    console.error(`[ERROR] ${message}`, {
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  warn(message: string, context?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, {
      timestamp: new Date().toISOString(),
      context,
    });
  }

  info(message: string, context?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, {
      timestamp: new Date().toISOString(),
      context,
    });
  }

  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, {
        timestamp: new Date().toISOString(),
        context,
      });
    }
  }
}

/**
 * In-Memory Tracer Implementation
 */
export class InMemoryTracer implements Tracer {
  private activeSpan: PerformanceSpan | null = null;
  private spans: PerformanceSpan[] = [];

  startSpan(operationName: string, parentSpanId?: string): PerformanceSpan {
    const span = new InMemorySpan(operationName, parentSpanId);
    this.spans.push(span);
    return span;
  }

  getActiveSpan(): PerformanceSpan | null {
    return this.activeSpan;
  }

  setActiveSpan(span: PerformanceSpan | null): void {
    this.activeSpan = span;
  }

  getSpans(): PerformanceSpan[] {
    return [...this.spans];
  }

  reset(): void {
    this.spans = [];
    this.activeSpan = null;
  }
}

/**
 * In-Memory Performance Span Implementation
 */
export class InMemorySpan implements PerformanceSpan {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly operationName: string;
  readonly startTime: Date;

  private endTime?: Date;
  private tags: Record<string, any> = {};
  private logs: LogEntry[] = [];
  private finished = false;
  private spanStatus: 'success' | 'error' | 'timeout' = 'success';

  constructor(operationName: string, parentSpanId?: string) {
    this.traceId = crypto.randomUUID();
    this.spanId = crypto.randomUUID();
    this.parentSpanId = parentSpanId;
    this.operationName = operationName;
    this.startTime = new Date();
  }

  setTag(key: string, value: any): void {
    this.tags[key] = value;
  }

  log(message: string, context?: Record<string, any>): void {
    this.logs.push({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context,
      traceId: this.traceId,
      spanId: this.spanId,
    });
  }

  finish(status: 'success' | 'error' | 'timeout' = 'success'): void {
    if (this.finished) return;

    this.endTime = new Date();
    this.spanStatus = status;
    this.finished = true;
  }

  isFinished(): boolean {
    return this.finished;
  }

  getDuration(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }
}

/**
 * Performance Monitor Decorator
 */
export function monitor(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const tracer = globalObservability.getTracer();
      const metrics = globalObservability.getMetrics();
      const logger = globalObservability.getLogger();

      const span = tracer.startSpan(name);
      const startTime = Date.now();

      try {
        span.setTag('method', propertyKey);
        span.setTag('class', target.constructor.name);

        const result = await originalMethod.apply(this, args);

        const duration = Date.now() - startTime;
        span.finish('success');

        metrics.histogram(`${name}.duration`, duration);
        metrics.increment(`${name}.success`);

        if (duration > 1000) {
          logger.warn(`Slow operation detected: ${name}`, {
            duration: `${duration}ms`,
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        span.finish('error');

        metrics.histogram(`${name}.duration`, duration);
        metrics.increment(`${name}.error`);

        logger.error(`Operation failed: ${name}`, {
          duration: `${duration}ms`,
        }, error instanceof Error ? error : new Error(String(error)));

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Business Metrics Tracker
 */
export class BusinessMetricsTracker {
  constructor(private metrics: MetricsCollector) {}

  // Booking metrics
  trackBookingCreated(tenantId: string, branchId: string): void {
    this.metrics.increment('bookings.created', { tenantId, branchId });
  }

  trackBookingConfirmed(tenantId: string, branchId: string): void {
    this.metrics.increment('bookings.confirmed', { tenantId, branchId });
  }

  trackBookingCancelled(tenantId: string, branchId: string, reason?: string): void {
    this.metrics.increment('bookings.cancelled', { tenantId, branchId, reason: reason || 'unknown' });
  }

  trackBookingCompleted(tenantId: string, branchId: string, revenue: number): void {
    this.metrics.increment('bookings.completed', { tenantId, branchId });
    this.metrics.histogram('bookings.revenue', revenue, { tenantId, branchId });
  }

  // User metrics
  trackUserLogin(tenantId: string, userType: string): void {
    this.metrics.increment('users.login', { tenantId, userType });
  }

  trackUserRegistration(tenantId: string, userType: string): void {
    this.metrics.increment('users.registration', { tenantId, userType });
  }

  // Performance metrics
  trackApiRequest(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.metrics.increment('api.requests', { endpoint, method, status: statusCode.toString() });
    this.metrics.histogram('api.duration', duration, { endpoint, method });
  }

  // Error metrics
  trackError(component: string, errorType: string, severity: string): void {
    this.metrics.increment('errors.total', { component, errorType, severity });
  }
}

/**
 * Default Health Checks
 */
export const defaultHealthChecks = {
  database: async (): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      // This would check database connectivity
      // For now, simulate a check
      await new Promise(resolve => setTimeout(resolve, 10));

      return {
        name: 'database',
        status: 'healthy',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  },

  redis: async (): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      // This would check Redis connectivity
      await new Promise(resolve => setTimeout(resolve, 5));

      return {
        name: 'redis',
        status: 'healthy',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  },

  external_apis: async (): Promise<HealthCheck> => {
    const start = Date.now();
    try {
      // This would check external API connectivity (Stripe, Twilio, etc.)
      await new Promise(resolve => setTimeout(resolve, 20));

      return {
        name: 'external_apis',
        status: 'healthy',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'external_apis',
        status: 'degraded',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  },
};

/**
 * Global Observability Instance
 */
export const globalObservability = new ObservabilityManager();

// Register default health checks
Object.entries(defaultHealthChecks).forEach(([name, checkFunction]) => {
  globalObservability.registerHealthCheck(name, checkFunction);
});

/**
 * Initialize observability with business metrics
 */
export const businessMetrics = new BusinessMetricsTracker(globalObservability.getMetrics());