/**
 * Integration Types Index
 *
 * Central export for all shared types and team-specific types
 * Provides type-safe integration across all teams
 */

// Shared types used across all teams
export * from './shared.types';

// Team-specific domain types
export * from './domain.types';

// Event types for cross-team communication
export * from './event.types';

// Integration-specific types
export * from './integration.types';

// Type utilities and helpers
export * from './utilities.types';

// Re-export contract types for convenience
export type {
  FoundationContract,
  DatabaseContract,
  AuthContract,
  BookingContract,
  EcommerceContract,
  CRMContract,
  AdminContract,
} from '../contracts';

// Team coordination types
export interface TeamCoordination {
  teamId: string;
  teamName: string;
  status: 'ready' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  dependents: string[];
  progress: number; // 0-100
  estimatedCompletion?: Date;
  blockers?: TeamBlocker[];
  resources: TeamResource[];
}

export interface TeamBlocker {
  id: string;
  type: 'dependency' | 'resource' | 'technical' | 'external';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedResolution?: Date;
  assignedTo?: string;
  createdAt: Date;
}

export interface TeamResource {
  type: 'agent' | 'service' | 'infrastructure';
  name: string;
  capacity: number;
  allocated: number;
  available: number;
  efficiency: number; // 0-1
}

// Integration health monitoring
export interface IntegrationHealth {
  teamId: string;
  contractCompliance: number; // 0-1
  apiHealth: {
    availability: number; // 0-1
    responseTime: number; // ms
    errorRate: number; // 0-1
    throughput: number; // requests/second
  };
  dependencies: {
    teamId: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    lastCheck: Date;
  }[];
  lastUpdated: Date;
}

// Cross-team communication patterns
export interface CrossTeamMessage {
  id: string;
  fromTeam: string;
  toTeam: string;
  type: 'request' | 'response' | 'notification' | 'event';
  payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  acknowledged?: boolean;
  processedAt?: Date;
  responseRequired: boolean;
  timeoutAt?: Date;
}

// Team metrics and KPIs
export interface TeamMetrics {
  teamId: string;
  period: {
    start: Date;
    end: Date;
  };
  productivity: {
    velocity: number; // story points per sprint
    burndownRate: number;
    cycleTime: number; // hours
    leadTime: number; // hours
  };
  quality: {
    defectRate: number; // 0-1
    testCoverage: number; // 0-1
    codeQuality: number; // 0-1
    documentation: number; // 0-1
  };
  collaboration: {
    crossTeamInteractions: number;
    blockerResolutionTime: number; // hours
    knowledgeSharing: number; // 0-1
    communicationEfficiency: number; // 0-1
  };
  delivery: {
    onTimeDelivery: number; // 0-1
    scopeCreep: number; // 0-1
    reworkRate: number; // 0-1
    customerSatisfaction: number; // 0-1
  };
}

// Integration testing types
export interface IntegrationTestSuite {
  id: string;
  name: string;
  teams: string[];
  scenarios: IntegrationTestScenario[];
  lastRun?: Date;
  status: 'pending' | 'running' | 'passed' | 'failed';
  results?: IntegrationTestResults;
}

export interface IntegrationTestScenario {
  id: string;
  name: string;
  description: string;
  steps: IntegrationTestStep[];
  expectedOutcome: string;
  timeout: number; // seconds
  retries: number;
  tags: string[];
}

export interface IntegrationTestStep {
  stepNumber: number;
  team: string;
  action: string;
  input: Record<string, any>;
  expectedOutput?: Record<string, any>;
  timeout: number; // seconds
}

export interface IntegrationTestResults {
  suiteId: string;
  runId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // ms
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  skippedScenarios: number;
  scenarios: {
    scenarioId: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number; // ms
    error?: string;
    steps: {
      stepNumber: number;
      status: 'passed' | 'failed' | 'skipped';
      duration: number; // ms
      error?: string;
      actualOutput?: Record<string, any>;
    }[];
  }[];
  coverage: {
    teams: string[];
    contracts: string[];
    endpoints: string[];
    coveragePercentage: number;
  };
}

// Performance monitoring
export interface TeamPerformanceSnapshot {
  teamId: string;
  timestamp: Date;
  cpu: number; // 0-1
  memory: number; // 0-1
  network: {
    inbound: number; // bytes/second
    outbound: number; // bytes/second
  };
  database: {
    connections: number;
    queryTime: number; // ms
    lockWaits: number;
  };
  cache: {
    hitRate: number; // 0-1
    evictionRate: number; // 0-1
    size: number; // bytes
  };
  errors: {
    rate: number; // errors/minute
    types: Record<string, number>;
  };
}

// Deployment coordination
export interface DeploymentPlan {
  id: string;
  name: string;
  teams: {
    teamId: string;
    order: number;
    dependencies: string[];
    rollbackPlan: string;
    healthChecks: string[];
  }[];
  environment: 'development' | 'staging' | 'production';
  scheduledAt: Date;
  estimatedDuration: number; // minutes
  rollbackStrategy: 'manual' | 'automatic';
  approvals: {
    teamId: string;
    approver: string;
    approvedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
}

// Configuration management
export interface TeamConfiguration {
  teamId: string;
  version: string;
  environment: Record<string, string>;
  features: {
    name: string;
    enabled: boolean;
    config: Record<string, any>;
  }[];
  integrations: {
    teamId: string;
    endpoint: string;
    timeout: number;
    retries: number;
    circuitBreaker: {
      enabled: boolean;
      threshold: number;
      timeout: number;
    };
  }[];
  monitoring: {
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
      destinations: string[];
    };
    metrics: {
      enabled: boolean;
      interval: number; // seconds
      retention: number; // days
    };
    alerts: {
      enabled: boolean;
      thresholds: Record<string, number>;
      channels: string[];
    };
  };
  lastUpdated: Date;
}

// Type utilities for team coordination
export type TeamEventType =
  | 'team_started'
  | 'team_completed'
  | 'team_blocked'
  | 'team_unblocked'
  | 'dependency_ready'
  | 'integration_established'
  | 'contract_updated'
  | 'health_degraded'
  | 'health_restored';

export type IntegrationPattern =
  | 'request_response'
  | 'event_driven'
  | 'publish_subscribe'
  | 'batch_processing'
  | 'streaming'
  | 'webhook'
  | 'polling';

export type DataFlowDirection = 'unidirectional' | 'bidirectional';

export type SynchronizationType = 'synchronous' | 'asynchronous' | 'eventual_consistency';

// Queen Agent coordination interfaces
export interface QueenAgentCommand {
  id: string;
  type: 'coordinate' | 'monitor' | 'resolve' | 'escalate' | 'optimize';
  targetTeams: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: Record<string, any>;
  expectedCompletion: Date;
  createdAt: Date;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface TeamOrchestration {
  orchestrationId: string;
  queenAgent: string;
  teams: {
    teamId: string;
    role: 'leader' | 'contributor' | 'observer';
    responsibilities: string[];
    communications: CrossTeamMessage[];
  }[];
  objectives: {
    id: string;
    description: string;
    priority: number;
    deadline: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    blockers?: TeamBlocker[];
  }[];
  coordination: {
    meetingSchedule: {
      frequency: 'daily' | 'weekly' | 'bi_weekly';
      duration: number; // minutes
      participants: string[];
    };
    reportingStructure: {
      teamId: string;
      reportsTo: string[];
      frequency: 'real_time' | 'hourly' | 'daily';
    }[];
    escalationPath: {
      level: number;
      criteria: string;
      escalateTo: string;
      timeout: number; // hours
    }[];
  };
  createdAt: Date;
  lastUpdated: Date;
}