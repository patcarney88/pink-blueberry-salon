/**
 * Team Dependency Graph
 *
 * Visual and programmatic representation of team interdependencies
 * Enables intelligent coordination and conflict resolution
 */

import type { TeamId } from '../events/cross-team.events';

// ============================================================================
// DEPENDENCY GRAPH TYPES
// ============================================================================

export interface TeamNode {
  id: TeamId;
  name: string;
  size: number;
  status: TeamStatus;
  capabilities: TeamCapability[];
  resources: TeamResource[];
  location: GraphCoordinate;
  metadata: TeamMetadata;
}

export interface TeamEdge {
  id: string;
  source: TeamId;
  target: TeamId;
  type: DependencyType;
  weight: number; // 0-1 (strength of dependency)
  latency: number; // expected communication latency in ms
  bandwidth: number; // expected data flow volume
  protocols: CommunicationProtocol[];
  contracts: string[]; // contract IDs
  status: EdgeStatus;
}

export interface DependencyGraph {
  nodes: TeamNode[];
  edges: TeamEdge[];
  metadata: GraphMetadata;
  version: string;
  lastUpdated: Date;
}

export type TeamStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'error';
export type DependencyType = 'hard' | 'soft' | 'optional' | 'circular';
export type EdgeStatus = 'active' | 'inactive' | 'degraded' | 'failed';

export interface TeamCapability {
  id: string;
  name: string;
  type: 'service' | 'data' | 'ui' | 'infrastructure' | 'security';
  maturity: 'planning' | 'development' | 'testing' | 'production';
  apis: APIEndpoint[];
  events: string[]; // event types this team publishes
  dependencies: string[]; // capability IDs this depends on
}

export interface TeamResource {
  id: string;
  type: 'human' | 'compute' | 'storage' | 'network' | 'external_service';
  capacity: number;
  allocated: number;
  efficiency: number; // 0-1
  cost: number; // per unit time
  availability: ResourceAvailability;
}

export interface ResourceAvailability {
  schedule: {
    start: string; // ISO time
    end: string; // ISO time
    timezone: string;
  };
  maintenance: {
    windows: MaintenanceWindow[];
    notice: number; // hours advance notice
  };
  sla: {
    uptime: number; // 0-1
    responseTime: number; // ms
    recovery: number; // minutes
  };
}

export interface MaintenanceWindow {
  start: Date;
  end: Date;
  type: 'planned' | 'emergency';
  impact: 'none' | 'degraded' | 'unavailable';
  description: string;
}

export interface GraphCoordinate {
  x: number;
  y: number;
  layer: number; // for hierarchical layout
}

export interface TeamMetadata {
  description: string;
  owner: string;
  contacts: ContactInfo[];
  repository: string;
  documentation: string;
  monitoring: MonitoringInfo;
  deployment: DeploymentInfo;
}

export interface ContactInfo {
  type: 'primary' | 'secondary' | 'escalation';
  name: string;
  email: string;
  role: string;
  timezone: string;
}

export interface MonitoringInfo {
  dashboardUrl: string;
  alertsUrl: string;
  logsUrl: string;
  metricsUrl: string;
  healthCheckUrl: string;
}

export interface DeploymentInfo {
  environment: 'development' | 'staging' | 'production';
  region: string;
  infrastructure: 'aws' | 'azure' | 'gcp' | 'on_premise';
  lastDeployment: Date;
  version: string;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  version: string;
  public: boolean;
  rateLimit: number; // requests per minute
  authentication: 'none' | 'api_key' | 'jwt' | 'oauth';
  documentation: string;
}

export type CommunicationProtocol = 'http' | 'graphql' | 'grpc' | 'websocket' | 'message_queue' | 'event_stream';

export interface GraphMetadata {
  totalNodes: number;
  totalEdges: number;
  cyclesDetected: number;
  criticalPath: TeamId[];
  bottlenecks: TeamId[];
  riskScore: number; // 0-1
  complexity: number; // 0-1
}

// ============================================================================
// DEPENDENCY ANALYSIS
// ============================================================================

export interface DependencyAnalysis {
  graph: DependencyGraph;
  criticalPath: CriticalPath;
  circularDependencies: CircularDependency[];
  bottlenecks: Bottleneck[];
  riskAssessment: RiskAssessment;
  recommendations: Recommendation[];
  optimizations: Optimization[];
}

export interface CriticalPath {
  path: TeamId[];
  totalDuration: number; // estimated hours
  riskFactor: number; // 0-1
  bottlenecks: string[];
  mitigation: string[];
}

export interface CircularDependency {
  cycle: TeamId[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  resolution: string[];
}

export interface Bottleneck {
  teamId: TeamId;
  type: 'resource' | 'capability' | 'dependency' | 'external';
  severity: number; // 0-1
  impact: {
    teamsAffected: TeamId[];
    delayRisk: number; // days
    cascadeEffect: boolean;
  };
  mitigation: {
    options: string[];
    estimatedCost: number;
    timeToImplement: number; // hours
  };
}

export interface RiskAssessment {
  overall: number; // 0-1
  categories: {
    technical: number;
    resource: number;
    schedule: number;
    external: number;
    integration: number;
  };
  factors: RiskFactor[];
  mitigation: RiskMitigation[];
}

export interface RiskFactor {
  id: string;
  type: 'technical' | 'resource' | 'schedule' | 'external' | 'integration';
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  riskScore: number; // probability * impact
  teamsAffected: TeamId[];
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface RiskMitigation {
  riskId: string;
  strategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  actions: string[];
  cost: number;
  timeframe: number; // hours
  effectiveness: number; // 0-1
  owner: string;
}

export interface Recommendation {
  id: string;
  type: 'architecture' | 'process' | 'resource' | 'tooling' | 'communication';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rationale: string;
  implementation: {
    steps: string[];
    effort: number; // hours
    cost: number;
    timeline: number; // days
  };
  benefits: {
    efficiency: number; // percentage improvement
    risk_reduction: number; // percentage
    cost_savings: number;
    time_savings: number; // hours
  };
  teamsAffected: TeamId[];
}

export interface Optimization {
  id: string;
  type: 'parallelization' | 'resource_reallocation' | 'dependency_reduction' | 'automation';
  target: TeamId[];
  description: string;
  currentState: Record<string, any>;
  proposedState: Record<string, any>;
  impact: {
    timeReduction: number; // hours
    resourceSavings: number; // percentage
    riskReduction: number; // percentage
    qualityImprovement: number; // percentage
  };
  implementation: {
    complexity: 'low' | 'medium' | 'high';
    effort: number; // hours
    dependencies: string[];
    timeline: number; // days
  };
}

// ============================================================================
// REAL-TIME MONITORING
// ============================================================================

export interface GraphMonitor {
  /**
   * Monitor graph state in real-time
   */
  monitor(): Promise<GraphHealth>;

  /**
   * Detect changes in dependencies
   */
  detectChanges(): Promise<GraphChange[]>;

  /**
   * Predict potential issues
   */
  predictIssues(): Promise<PredictedIssue[]>;

  /**
   * Optimize resource allocation
   */
  optimizeResources(): Promise<ResourceOptimization>;
}

export interface GraphHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  nodes: {
    teamId: TeamId;
    health: 'healthy' | 'degraded' | 'critical';
    responseTime: number;
    errorRate: number;
    throughput: number;
  }[];
  edges: {
    edgeId: string;
    health: 'healthy' | 'degraded' | 'critical';
    latency: number;
    bandwidth: number;
    errorRate: number;
  }[];
  issues: GraphIssue[];
}

export interface GraphChange {
  id: string;
  type: 'node_added' | 'node_removed' | 'edge_added' | 'edge_removed' | 'capability_changed' | 'status_changed';
  timestamp: Date;
  details: {
    previous: any;
    current: any;
    impact: TeamId[];
  };
  automatic: boolean;
  approvedBy?: string;
}

export interface PredictedIssue {
  id: string;
  type: 'bottleneck' | 'failure' | 'overload' | 'dependency_break';
  probability: number; // 0-1
  timeframe: number; // hours until predicted occurrence
  impact: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    teamsAffected: TeamId[];
    estimatedDowntime: number; // minutes
    businessImpact: string;
  };
  preventiveActions: {
    action: string;
    effort: number; // hours
    effectiveness: number; // 0-1
  }[];
}

export interface ResourceOptimization {
  currentUtilization: Record<TeamId, number>; // 0-1
  recommendations: {
    teamId: TeamId;
    action: 'scale_up' | 'scale_down' | 'reallocate' | 'optimize';
    resources: string[];
    expectedImprovement: number; // percentage
    cost: number;
  }[];
  projectedSavings: {
    cost: number;
    time: number; // hours
    efficiency: number; // percentage improvement
  };
}

export interface GraphIssue {
  id: string;
  type: 'performance' | 'availability' | 'dependency' | 'resource' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  teamsAffected: TeamId[];
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  preventative: string[];
}

// ============================================================================
// GRAPH OPERATIONS
// ============================================================================

export class DependencyGraphManager {
  private graph: DependencyGraph;

  constructor(initialGraph?: DependencyGraph) {
    this.graph = initialGraph || this.createDefaultGraph();
  }

  /**
   * Add a new team node to the graph
   */
  addTeam(team: TeamNode): void {
    if (this.graph.nodes.find(n => n.id === team.id)) {
      throw new Error(`Team ${team.id} already exists`);
    }
    this.graph.nodes.push(team);
    this.updateMetadata();
  }

  /**
   * Add a dependency edge between teams
   */
  addDependency(edge: TeamEdge): void {
    if (!this.graph.nodes.find(n => n.id === edge.source)) {
      throw new Error(`Source team ${edge.source} does not exist`);
    }
    if (!this.graph.nodes.find(n => n.id === edge.target)) {
      throw new Error(`Target team ${edge.target} does not exist`);
    }
    this.graph.edges.push(edge);
    this.updateMetadata();
  }

  /**
   * Update team status
   */
  updateTeamStatus(teamId: TeamId, status: TeamStatus): void {
    const team = this.graph.nodes.find(n => n.id === teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }
    team.status = status;
    this.updateMetadata();
  }

  /**
   * Get teams that are ready to start (dependencies completed)
   */
  getReadyTeams(): TeamId[] {
    return this.graph.nodes
      .filter(node => {
        if (node.status !== 'not_started') return false;

        const dependencies = this.graph.edges
          .filter(edge => edge.target === node.id && edge.type === 'hard')
          .map(edge => edge.source);

        return dependencies.every(depId => {
          const depTeam = this.graph.nodes.find(n => n.id === depId);
          return depTeam?.status === 'completed';
        });
      })
      .map(node => node.id);
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(): CircularDependency[] {
    const visited = new Set<TeamId>();
    const recursionStack = new Set<TeamId>();
    const cycles: CircularDependency[] = [];

    const dfs = (nodeId: TeamId, path: TeamId[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const edges = this.graph.edges.filter(e => e.source === nodeId);

      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          dfs(edge.target, [...path, nodeId]);
        } else if (recursionStack.has(edge.target)) {
          // Found a cycle
          const cycleStart = path.indexOf(edge.target);
          const cycle = path.slice(cycleStart).concat([edge.target]);

          cycles.push({
            cycle,
            severity: this.assessCycleSeverity(cycle),
            impact: `Circular dependency affects ${cycle.length} teams`,
            resolution: this.suggestCycleResolution(cycle),
          });
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const node of this.graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return cycles;
  }

  /**
   * Find critical path through the graph
   */
  findCriticalPath(): CriticalPath {
    // Implement longest path algorithm (topological sort + longest path)
    const sorted = this.topologicalSort();
    const distances = new Map<TeamId, number>();
    const predecessors = new Map<TeamId, TeamId | null>();

    // Initialize distances
    for (const nodeId of sorted) {
      distances.set(nodeId, 0);
      predecessors.set(nodeId, null);
    }

    // Calculate longest paths
    for (const nodeId of sorted) {
      const currentDistance = distances.get(nodeId) || 0;
      const outgoingEdges = this.graph.edges.filter(e => e.source === nodeId);

      for (const edge of outgoingEdges) {
        const targetDistance = distances.get(edge.target) || 0;
        const newDistance = currentDistance + edge.weight * 100; // Convert to hours

        if (newDistance > targetDistance) {
          distances.set(edge.target, newDistance);
          predecessors.set(edge.target, nodeId);
        }
      }
    }

    // Find the node with maximum distance
    let maxDistance = 0;
    let endNode: TeamId | null = null;

    for (const [nodeId, distance] of distances) {
      if (distance > maxDistance) {
        maxDistance = distance;
        endNode = nodeId;
      }
    }

    // Reconstruct path
    const path: TeamId[] = [];
    let current = endNode;

    while (current !== null) {
      path.unshift(current);
      current = predecessors.get(current) || null;
    }

    return {
      path,
      totalDuration: maxDistance,
      riskFactor: this.calculatePathRisk(path),
      bottlenecks: this.identifyPathBottlenecks(path),
      mitigation: this.suggestPathMitigation(path),
    };
  }

  /**
   * Analyze the complete dependency graph
   */
  analyze(): DependencyAnalysis {
    const circularDependencies = this.detectCircularDependencies();
    const criticalPath = this.findCriticalPath();
    const bottlenecks = this.identifyBottlenecks();
    const riskAssessment = this.assessRisk();

    return {
      graph: this.graph,
      criticalPath,
      circularDependencies,
      bottlenecks,
      riskAssessment,
      recommendations: this.generateRecommendations(),
      optimizations: this.generateOptimizations(),
    };
  }

  // Private helper methods
  private createDefaultGraph(): DependencyGraph {
    return {
      nodes: [],
      edges: [],
      metadata: {
        totalNodes: 0,
        totalEdges: 0,
        cyclesDetected: 0,
        criticalPath: [],
        bottlenecks: [],
        riskScore: 0,
        complexity: 0,
      },
      version: '1.0.0',
      lastUpdated: new Date(),
    };
  }

  private updateMetadata(): void {
    this.graph.metadata.totalNodes = this.graph.nodes.length;
    this.graph.metadata.totalEdges = this.graph.edges.length;
    this.graph.metadata.cyclesDetected = this.detectCircularDependencies().length;
    this.graph.lastUpdated = new Date();
  }

  private topologicalSort(): TeamId[] {
    const visited = new Set<TeamId>();
    const stack: TeamId[] = [];

    const dfs = (nodeId: TeamId): void => {
      visited.add(nodeId);
      const edges = this.graph.edges.filter(e => e.source === nodeId);

      for (const edge of edges) {
        if (!visited.has(edge.target)) {
          dfs(edge.target);
        }
      }

      stack.push(nodeId);
    };

    for (const node of this.graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return stack.reverse();
  }

  private assessCycleSeverity(cycle: TeamId[]): 'low' | 'medium' | 'high' | 'critical' {
    // Implement severity assessment logic
    if (cycle.length > 4) return 'critical';
    if (cycle.length > 2) return 'high';
    return 'medium';
  }

  private suggestCycleResolution(cycle: TeamId[]): string[] {
    return [
      'Introduce abstraction layer',
      'Use event-driven communication',
      'Implement dependency inversion',
      'Split shared concerns into separate service',
    ];
  }

  private calculatePathRisk(path: TeamId[]): number {
    // Implement risk calculation logic
    return 0.5; // Placeholder
  }

  private identifyPathBottlenecks(path: TeamId[]): string[] {
    // Implement bottleneck identification
    return []; // Placeholder
  }

  private suggestPathMitigation(path: TeamId[]): string[] {
    return [
      'Parallelize independent tasks',
      'Add buffer time for critical dependencies',
      'Implement fallback strategies',
    ];
  }

  private identifyBottlenecks(): Bottleneck[] {
    // Implement bottleneck identification logic
    return []; // Placeholder
  }

  private assessRisk(): RiskAssessment {
    // Implement comprehensive risk assessment
    return {
      overall: 0.3,
      categories: {
        technical: 0.2,
        resource: 0.4,
        schedule: 0.3,
        external: 0.1,
        integration: 0.5,
      },
      factors: [],
      mitigation: [],
    };
  }

  private generateRecommendations(): Recommendation[] {
    // Implement recommendation generation
    return [];
  }

  private generateOptimizations(): Optimization[] {
    // Implement optimization suggestions
    return [];
  }

  /**
   * Export graph for visualization
   */
  exportForVisualization(): {
    nodes: Array<{
      id: string;
      label: string;
      group: string;
      level: number;
      status: string;
      size: number;
    }>;
    edges: Array<{
      from: string;
      to: string;
      label: string;
      color: string;
      width: number;
      dashes: boolean;
    }>;
  } {
    const nodes = this.graph.nodes.map(node => ({
      id: node.id,
      label: `${node.name}\n(${node.size} agents)`,
      group: node.status,
      level: node.location.layer,
      status: node.status,
      size: node.size,
    }));

    const edges = this.graph.edges.map(edge => ({
      from: edge.source,
      to: edge.target,
      label: edge.type,
      color: this.getEdgeColor(edge.type, edge.status),
      width: Math.max(1, edge.weight * 5),
      dashes: edge.type === 'soft',
    }));

    return { nodes, edges };
  }

  private getEdgeColor(type: DependencyType, status: EdgeStatus): string {
    if (status === 'failed') return '#ff4444';
    if (status === 'degraded') return '#ff8800';
    if (type === 'hard') return '#2196f3';
    if (type === 'soft') return '#4caf50';
    return '#999999';
  }
}