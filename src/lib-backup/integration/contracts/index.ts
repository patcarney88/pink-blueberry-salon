/**
 * Integration Contracts Index
 *
 * Central export for all team API contracts
 * Ensures type safety across team integrations
 */

// Team Contracts
export * from './foundation.contract';
export * from './database.contract';
export * from './auth.contract';
export * from './booking.contract';
export * from './ecommerce.contract';
export * from './crm.contract';
export * from './admin.contract';

// Contract Registry for Runtime Access
export const CONTRACT_REGISTRY = {
  foundation: 'foundation.contract',
  database: 'database.contract',
  auth: 'auth.contract',
  booking: 'booking.contract',
  ecommerce: 'ecommerce.contract',
  crm: 'crm.contract',
  admin: 'admin.contract',
} as const;

// Team Dependencies Graph
export const TEAM_DEPENDENCIES = {
  foundation: {
    dependencies: [],
    dependents: ['database', 'auth', 'booking', 'ecommerce', 'crm', 'admin'],
    status: 'completed',
  },
  database: {
    dependencies: ['foundation'],
    dependents: ['auth', 'booking', 'ecommerce', 'crm', 'admin'],
    status: 'in_progress',
  },
  auth: {
    dependencies: ['foundation', 'database'],
    dependents: ['booking', 'ecommerce', 'crm', 'admin'],
    status: 'pending',
  },
  booking: {
    dependencies: ['foundation', 'database', 'auth'],
    dependents: ['admin'],
    status: 'pending',
  },
  ecommerce: {
    dependencies: ['foundation', 'database', 'auth'],
    dependents: ['admin'],
    status: 'pending',
  },
  crm: {
    dependencies: ['foundation', 'database', 'auth'],
    dependents: ['admin'],
    status: 'pending',
  },
  admin: {
    dependencies: ['foundation', 'database', 'auth', 'booking', 'ecommerce', 'crm'],
    dependents: [],
    status: 'pending',
  },
} as const;

// Team Sizes for Resource Planning
export const TEAM_SIZES = {
  foundation: 16, // ✅ COMPLETED
  database: 8,
  auth: 8,
  booking: 20, // Largest team - complex booking system
  ecommerce: 16,
  crm: 12,
  admin: 16,
} as const;

// Contract Validation Types
export type TeamName = keyof typeof TEAM_DEPENDENCIES;
export type ContractName = keyof typeof CONTRACT_REGISTRY;
export type TeamStatus = 'completed' | 'in_progress' | 'pending' | 'blocked';

export interface TeamInfo {
  name: TeamName;
  size: number;
  dependencies: TeamName[];
  dependents: TeamName[];
  status: TeamStatus;
  contract: ContractName;
}

// Helper Functions
export function getTeamInfo(teamName: TeamName): TeamInfo {
  const deps = TEAM_DEPENDENCIES[teamName];
  return {
    name: teamName,
    size: TEAM_SIZES[teamName],
    dependencies: deps.dependencies,
    dependents: deps.dependents,
    status: deps.status,
    contract: teamName as ContractName,
  };
}

export function getTeamDependencies(teamName: TeamName): TeamName[] {
  return TEAM_DEPENDENCIES[teamName].dependencies;
}

export function getTeamDependents(teamName: TeamName): TeamName[] {
  return TEAM_DEPENDENCIES[teamName].dependents;
}

export function canTeamStart(teamName: TeamName): boolean {
  const dependencies = getTeamDependencies(teamName);
  return dependencies.every(dep => TEAM_DEPENDENCIES[dep].status === 'completed');
}

export function getReadyTeams(): TeamName[] {
  return Object.keys(TEAM_DEPENDENCIES).filter(team =>
    canTeamStart(team as TeamName) &&
    TEAM_DEPENDENCIES[team as TeamName].status === 'pending'
  ) as TeamName[];
}

export function getTotalAgents(): number {
  return Object.values(TEAM_SIZES).reduce((sum, size) => sum + size, 0);
}