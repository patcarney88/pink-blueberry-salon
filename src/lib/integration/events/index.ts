/**
 * Events Index
 *
 * Central export for all event definitions and utilities
 */

// Core event types and definitions
export * from './cross-team.events';

// Event management utilities
export * from './event-bus';
export * from './event-patterns';

// Event routing and subscription management
export interface EventBusConfig {
  provider: 'memory' | 'redis' | 'kafka' | 'nats' | 'aws_eventbridge';
  config: Record<string, any>;
  defaultTimeout: number;
  defaultRetries: number;
  enableDeadLetterQueue: boolean;
  enableMetrics: boolean;
  enableTracing: boolean;
}

// Event publishing interface
export interface EventPublisher {
  publish<T extends import('./cross-team.events').EventName>(
    event: import('./cross-team.events').AllEvents[T]
  ): Promise<void>;

  publishBatch<T extends import('./cross-team.events').EventName>(
    events: import('./cross-team.events').AllEvents[T][]
  ): Promise<void>;
}

// Event subscription interface
export interface EventSubscriber {
  subscribe<T extends import('./cross-team.events').EventName>(
    eventPattern: string,
    handler: (event: import('./cross-team.events').AllEvents[T]) => Promise<void>,
    options?: SubscriptionOptions
  ): Promise<string>; // returns subscription ID

  unsubscribe(subscriptionId: string): Promise<void>;
}

export interface SubscriptionOptions {
  batchSize?: number;
  maxWaitTime?: number;
  deadLetterQueue?: string;
  retryPolicy?: RetryPolicy;
  filterCriteria?: Record<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number; // milliseconds
  maxDelay?: number; // milliseconds
  multiplier?: number; // for exponential backoff
}

// Event middleware for cross-cutting concerns
export interface EventMiddleware {
  name: string;
  onPublish?: (event: any) => Promise<any>;
  onSubscribe?: (event: any) => Promise<any>;
  onError?: (error: Error, event: any) => Promise<void>;
}

// Built-in middleware
export const MIDDLEWARE = {
  LOGGING: 'logging',
  METRICS: 'metrics',
  TRACING: 'tracing',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  RATE_LIMITING: 'rate_limiting',
} as const;

// Event processing status
export interface EventProcessingStatus {
  eventId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  error?: string;
  processingTime?: number; // milliseconds
}

// Team event coordination
export interface TeamEventCoordinator {
  /**
   * Coordinate multi-team workflows
   */
  orchestrate(
    workflowId: string,
    steps: WorkflowStep[]
  ): Promise<WorkflowExecution>;

  /**
   * Monitor workflow progress
   */
  getWorkflowStatus(workflowId: string): Promise<WorkflowStatus>;

  /**
   * Handle workflow failures and compensation
   */
  compensate(workflowId: string, reason: string): Promise<void>;
}

export interface WorkflowStep {
  stepId: string;
  team: import('./cross-team.events').TeamId;
  action: string;
  input: Record<string, any>;
  dependencies: string[]; // stepIds that must complete first
  timeout: number; // seconds
  retries: number;
  compensation?: {
    action: string;
    input: Record<string, any>;
  };
}

export interface WorkflowExecution {
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensating';
  steps: {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'compensated';
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    output?: Record<string, any>;
  }[];
  startedAt: Date;
  completedAt?: Date;
  totalDuration?: number; // milliseconds
}

export interface WorkflowStatus {
  workflowId: string;
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  progress: number; // 0-100
  estimatedCompletion?: Date;
}

// Event-driven integration patterns
export const INTEGRATION_PATTERNS = {
  REQUEST_RESPONSE: 'request_response',
  FIRE_AND_FORGET: 'fire_and_forget',
  PUBLISH_SUBSCRIBE: 'publish_subscribe',
  SAGA: 'saga',
  CHOREOGRAPHY: 'choreography',
  ORCHESTRATION: 'orchestration',
} as const;

export type IntegrationPattern = typeof INTEGRATION_PATTERNS[keyof typeof INTEGRATION_PATTERNS];

// Event stream processing
export interface EventStream {
  streamId: string;
  events: import('./cross-team.events').BaseEvent[];
  position: number;
  timestamp: Date;
}

export interface EventProjection {
  projectionId: string;
  name: string;
  eventPatterns: string[];
  state: Record<string, any>;
  lastEventPosition: number;
  lastUpdated: Date;
}

// Cross-team saga management
export interface Saga {
  sagaId: string;
  type: string;
  status: 'started' | 'compensating' | 'completed' | 'aborted';
  steps: SagaStep[];
  context: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
}

export interface SagaStep {
  stepId: string;
  team: import('./cross-team.events').TeamId;
  command: string;
  compensation: string;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  data: Record<string, any>;
  executedAt?: Date;
  compensatedAt?: Date;
}

// Event sourcing support
export interface EventSourcingStore {
  appendEvents(
    streamId: string,
    events: import('./cross-team.events').BaseEvent[],
    expectedVersion?: number
  ): Promise<void>;

  getEvents(
    streamId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<import('./cross-team.events').BaseEvent[]>;

  getSnapshot<T>(
    streamId: string,
    snapshotType: string
  ): Promise<T | null>;

  saveSnapshot<T>(
    streamId: string,
    snapshotType: string,
    snapshot: T,
    version: number
  ): Promise<void>;
}

// Team health monitoring through events
export interface TeamHealthMonitor {
  /**
   * Monitor team health through event patterns
   */
  monitorTeam(teamId: import('./cross-team.events').TeamId): Promise<TeamHealth>;

  /**
   * Get team performance metrics
   */
  getTeamMetrics(
    teamId: import('./cross-team.events').TeamId,
    period: { start: Date; end: Date }
  ): Promise<TeamPerformanceMetrics>;

  /**
   * Detect team integration issues
   */
  detectIssues(teamId: import('./cross-team.events').TeamId): Promise<IntegrationIssue[]>;
}

export interface TeamHealth {
  teamId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  eventThroughput: number; // events/minute
  errorRate: number; // 0-1
  averageProcessingTime: number; // milliseconds
  lastActivity: Date;
  issues: string[];
}

export interface TeamPerformanceMetrics {
  teamId: string;
  period: { start: Date; end: Date };
  eventsPublished: number;
  eventsConsumed: number;
  averagePublishTime: number; // milliseconds
  averageProcessingTime: number; // milliseconds
  errorRate: number; // 0-1
  throughput: number; // events/second
  peakThroughput: number;
  integrationLatency: Record<string, number>; // latency to each other team
}

export interface IntegrationIssue {
  type: 'timeout' | 'high_error_rate' | 'slow_processing' | 'integration_failure';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedTeams: string[];
  detectedAt: Date;
  suggestedActions: string[];
}

// Event replay and debugging
export interface EventReplayService {
  /**
   * Replay events for debugging or recovery
   */
  replay(
    streamId: string,
    fromTimestamp: Date,
    toTimestamp: Date,
    targetTeam?: string
  ): Promise<ReplayResult>;

  /**
   * Create point-in-time snapshot
   */
  createSnapshot(
    timestamp: Date,
    teams?: string[]
  ): Promise<SystemSnapshot>;

  /**
   * Restore system to point-in-time
   */
  restore(snapshotId: string): Promise<RestoreResult>;
}

export interface ReplayResult {
  replayId: string;
  eventsReplayed: number;
  duration: number; // milliseconds
  errors: string[];
  success: boolean;
}

export interface SystemSnapshot {
  snapshotId: string;
  timestamp: Date;
  teams: string[];
  eventCount: number;
  stateChecksum: string;
  size: number; // bytes
}

export interface RestoreResult {
  success: boolean;
  restoredEvents: number;
  duration: number; // milliseconds
  errors: string[];
  finalState: Record<string, any>;
}