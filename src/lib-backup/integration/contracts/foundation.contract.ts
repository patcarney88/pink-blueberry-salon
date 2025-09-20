/**
 * Foundation Team API Contract
 *
 * Team Size: 16 agents
 * Status: ✅ COMPLETED
 * Purpose: Next.js 14 setup, core infrastructure
 */

export interface FoundationContract {
  // Core Infrastructure
  app: {
    /**
     * Initialize core Next.js application
     */
    initialize(): Promise<{ success: boolean; version: string }>;

    /**
     * Get application health status
     */
    health(): Promise<{
      status: 'healthy' | 'degraded' | 'down';
      services: Record<string, boolean>;
      uptime: number;
    }>;
  };

  // Layout Management
  layouts: {
    /**
     * Register layout components
     */
    register(layout: LayoutConfig): Promise<void>;

    /**
     * Get available layouts
     */
    getLayouts(): Promise<LayoutConfig[]>;
  };

  // Theme & UI Foundation
  theme: {
    /**
     * Initialize theme system
     */
    initialize(): Promise<void>;

    /**
     * Get current theme configuration
     */
    getConfig(): Promise<ThemeConfig>;

    /**
     * Update theme settings
     */
    updateTheme(config: Partial<ThemeConfig>): Promise<void>;
  };

  // Core Components
  components: {
    /**
     * Register core UI components
     */
    register(component: ComponentDefinition): Promise<void>;

    /**
     * Get component registry
     */
    getRegistry(): Promise<ComponentRegistry>;
  };

  // Environment Configuration
  config: {
    /**
     * Get environment configuration
     */
    getEnv(): Promise<EnvironmentConfig>;

    /**
     * Validate configuration
     */
    validate(): Promise<ValidationResult>;
  };
}

// Supporting Types
export interface LayoutConfig {
  id: string;
  name: string;
  path: string;
  metadata: {
    title: string;
    description: string;
    protected: boolean;
  };
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

export interface ComponentDefinition {
  name: string;
  version: string;
  path: string;
  props: Record<string, any>;
  dependencies: string[];
}

export interface ComponentRegistry {
  components: ComponentDefinition[];
  lastUpdated: Date;
}

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  API_BASE_URL: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}