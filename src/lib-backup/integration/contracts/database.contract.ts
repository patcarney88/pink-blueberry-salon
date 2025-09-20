/**
 * Database Team API Contract
 *
 * Team Size: 8 agents
 * Purpose: Prisma PostgreSQL schema, migrations, data layer
 * Dependencies: Foundation Team (✅ completed)
 */

import { Prisma } from '@prisma/client';

export interface DatabaseContract {
  // Schema Management
  schema: {
    /**
     * Initialize database schema
     */
    initialize(): Promise<{ success: boolean; version: string }>;

    /**
     * Run pending migrations
     */
    migrate(): Promise<MigrationResult>;

    /**
     * Rollback last migration
     */
    rollback(): Promise<MigrationResult>;

    /**
     * Get schema version
     */
    getVersion(): Promise<string>;
  };

  // Connection Management
  connection: {
    /**
     * Test database connection
     */
    test(): Promise<ConnectionStatus>;

    /**
     * Get connection pool status
     */
    getPoolStatus(): Promise<PoolStatus>;

    /**
     * Close all connections
     */
    close(): Promise<void>;
  };

  // Data Operations
  operations: {
    /**
     * Execute raw SQL query
     */
    raw<T = any>(query: string, params?: any[]): Promise<T>;

    /**
     * Begin transaction
     */
    transaction<T>(
      fn: (tx: Prisma.TransactionClient) => Promise<T>
    ): Promise<T>;

    /**
     * Backup database
     */
    backup(): Promise<BackupResult>;

    /**
     * Restore from backup
     */
    restore(backupId: string): Promise<RestoreResult>;
  };

  // Performance Monitoring
  monitoring: {
    /**
     * Get query performance metrics
     */
    getMetrics(): Promise<DatabaseMetrics>;

    /**
     * Get slow queries
     */
    getSlowQueries(): Promise<SlowQuery[]>;

    /**
     * Analyze query performance
     */
    analyzeQuery(query: string): Promise<QueryAnalysis>;
  };

  // Data Integrity
  integrity: {
    /**
     * Run integrity checks
     */
    check(): Promise<IntegrityReport>;

    /**
     * Repair data inconsistencies
     */
    repair(): Promise<RepairResult>;

    /**
     * Validate foreign key constraints
     */
    validateConstraints(): Promise<ConstraintValidation>;
  };
}

// Supporting Types
export interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  errors: string[];
  duration: number;
}

export interface ConnectionStatus {
  connected: boolean;
  latency: number;
  error?: string;
}

export interface PoolStatus {
  active: number;
  idle: number;
  total: number;
  waiting: number;
}

export interface BackupResult {
  id: string;
  size: number;
  duration: number;
  location: string;
  checksum: string;
}

export interface RestoreResult {
  success: boolean;
  duration: number;
  recordsRestored: number;
  errors: string[];
}

export interface DatabaseMetrics {
  connections: {
    active: number;
    total: number;
  };
  queries: {
    total: number;
    averageTime: number;
    slowQueries: number;
  };
  storage: {
    size: number;
    freeSpace: number;
  };
  performance: {
    cpu: number;
    memory: number;
    diskIO: number;
  };
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  frequency: number;
}

export interface QueryAnalysis {
  executionPlan: string;
  estimatedCost: number;
  recommendations: string[];
  indexSuggestions: string[];
}

export interface IntegrityReport {
  valid: boolean;
  issues: IntegrityIssue[];
  summary: {
    tables: number;
    records: number;
    orphaned: number;
    duplicates: number;
  };
}

export interface IntegrityIssue {
  type: 'orphaned' | 'duplicate' | 'constraint' | 'type_mismatch';
  table: string;
  column?: string;
  description: string;
  recordId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RepairResult {
  fixed: number;
  failed: number;
  details: RepairDetail[];
}

export interface RepairDetail {
  issue: IntegrityIssue;
  action: string;
  success: boolean;
  error?: string;
}

export interface ConstraintValidation {
  valid: boolean;
  violations: ConstraintViolation[];
}

export interface ConstraintViolation {
  table: string;
  constraint: string;
  type: 'foreign_key' | 'unique' | 'check' | 'not_null';
  recordId: string;
  details: string;
}