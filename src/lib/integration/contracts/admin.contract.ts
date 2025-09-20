/**
 * Admin Dashboard Team API Contract
 *
 * Team Size: 16 agents
 * Purpose: Comprehensive admin panel with analytics and management
 * Dependencies: All other teams (Foundation ✅, Database, Auth, Booking, E-commerce, CRM)
 */

export interface AdminContract {
  // Dashboard Overview
  dashboard: {
    /**
     * Get main dashboard data
     */
    getOverview(period?: DateRange): Promise<DashboardOverview>;

    /**
     * Get real-time metrics
     */
    getRealTimeMetrics(): Promise<RealTimeMetrics>;

    /**
     * Get key performance indicators
     */
    getKPIs(period: DateRange): Promise<KPIDashboard>;

    /**
     * Get performance alerts
     */
    getAlerts(): Promise<Alert[]>;

    /**
     * Dismiss alert
     */
    dismissAlert(alertId: string): Promise<AlertResult>;

    /**
     * Get widget data
     */
    getWidgetData(widgetId: string, config?: WidgetConfig): Promise<WidgetData>;

    /**
     * Save dashboard layout
     */
    saveDashboardLayout(
      userId: string,
      layout: DashboardLayout
    ): Promise<LayoutResult>;

    /**
     * Get dashboard layout
     */
    getDashboardLayout(userId: string): Promise<DashboardLayout>;
  };

  // Analytics & Reporting
  analytics: {
    /**
     * Generate business report
     */
    generateReport(
      type: ReportType,
      period: DateRange,
      filters?: ReportFilters
    ): Promise<BusinessReport>;

    /**
     * Get revenue analytics
     */
    getRevenueAnalytics(period: DateRange): Promise<RevenueAnalytics>;

    /**
     * Get customer analytics
     */
    getCustomerAnalytics(period: DateRange): Promise<CustomerAnalytics>;

    /**
     * Get service performance
     */
    getServicePerformance(period: DateRange): Promise<ServicePerformance>;

    /**
     * Get staff performance
     */
    getStaffPerformance(
      period: DateRange,
      staffId?: string
    ): Promise<StaffPerformance>;

    /**
     * Get booking analytics
     */
    getBookingAnalytics(period: DateRange): Promise<BookingAnalytics>;

    /**
     * Get financial summary
     */
    getFinancialSummary(period: DateRange): Promise<FinancialSummary>;

    /**
     * Get trend analysis
     */
    getTrendAnalysis(
      metric: string,
      period: DateRange
    ): Promise<TrendAnalysis>;

    /**
     * Export report
     */
    exportReport(
      reportId: string,
      format: 'pdf' | 'excel' | 'csv'
    ): Promise<ExportResult>;

    /**
     * Schedule recurring report
     */
    scheduleReport(
      report: ScheduledReport
    ): Promise<ScheduleResult>;
  };

  // User Management
  users: {
    /**
     * Get all users
     */
    getAll(filters?: UserFilters): Promise<AdminUser[]>;

    /**
     * Get user by ID
     */
    getById(userId: string): Promise<AdminUser | null>;

    /**
     * Create new user
     */
    create(user: CreateUserData): Promise<UserResult>;

    /**
     * Update user
     */
    update(userId: string, updates: UpdateUserData): Promise<UserResult>;

    /**
     * Delete user
     */
    delete(userId: string): Promise<DeleteResult>;

    /**
     * Reset user password
     */
    resetPassword(userId: string): Promise<PasswordResetResult>;

    /**
     * Update user permissions
     */
    updatePermissions(
      userId: string,
      permissions: Permission[]
    ): Promise<PermissionResult>;

    /**
     * Get user activity log
     */
    getActivityLog(
      userId: string,
      filters?: ActivityFilters
    ): Promise<UserActivity[]>;

    /**
     * Bulk operations
     */
    bulkUpdate(
      userIds: string[],
      updates: BulkUpdateData
    ): Promise<BulkResult>;
  };

  // Role & Permission Management
  roles: {
    /**
     * Get all roles
     */
    getRoles(): Promise<Role[]>;

    /**
     * Create role
     */
    createRole(role: CreateRoleData): Promise<RoleResult>;

    /**
     * Update role
     */
    updateRole(roleId: string, updates: UpdateRoleData): Promise<RoleResult>;

    /**
     * Delete role
     */
    deleteRole(roleId: string): Promise<DeleteResult>;

    /**
     * Get available permissions
     */
    getPermissions(): Promise<Permission[]>;

    /**
     * Assign role to user
     */
    assignRole(userId: string, roleId: string): Promise<AssignmentResult>;

    /**
     * Remove role from user
     */
    removeRole(userId: string, roleId: string): Promise<RemovalResult>;
  };

  // System Configuration
  settings: {
    /**
     * Get system settings
     */
    getSystemSettings(): Promise<SystemSettings>;

    /**
     * Update system settings
     */
    updateSystemSettings(
      settings: Partial<SystemSettings>
    ): Promise<SettingsResult>;

    /**
     * Get business settings
     */
    getBusinessSettings(): Promise<BusinessSettings>;

    /**
     * Update business settings
     */
    updateBusinessSettings(
      settings: Partial<BusinessSettings>
    ): Promise<SettingsResult>;

    /**
     * Get notification settings
     */
    getNotificationSettings(): Promise<NotificationSettings>;

    /**
     * Update notification settings
     */
    updateNotificationSettings(
      settings: Partial<NotificationSettings>
    ): Promise<SettingsResult>;

    /**
     * Get integration settings
     */
    getIntegrationSettings(): Promise<IntegrationSettings>;

    /**
     * Update integration settings
     */
    updateIntegrationSettings(
      settings: Partial<IntegrationSettings>
    ): Promise<SettingsResult>;

    /**
     * Test integration
     */
    testIntegration(
      integration: string,
      config: Record<string, any>
    ): Promise<TestResult>;
  };

  // Content Management
  content: {
    /**
     * Get content items
     */
    getContent(type?: ContentType): Promise<ContentItem[]>;

    /**
     * Create content
     */
    createContent(content: CreateContentData): Promise<ContentResult>;

    /**
     * Update content
     */
    updateContent(
      contentId: string,
      updates: UpdateContentData
    ): Promise<ContentResult>;

    /**
     * Delete content
     */
    deleteContent(contentId: string): Promise<DeleteResult>;

    /**
     * Publish content
     */
    publishContent(contentId: string): Promise<PublishResult>;

    /**
     * Unpublish content
     */
    unpublishContent(contentId: string): Promise<PublishResult>;

    /**
     * Get content versions
     */
    getVersions(contentId: string): Promise<ContentVersion[]>;

    /**
     * Restore content version
     */
    restoreVersion(
      contentId: string,
      versionId: string
    ): Promise<RestoreResult>;

    /**
     * Upload media
     */
    uploadMedia(file: File, metadata?: MediaMetadata): Promise<MediaResult>;

    /**
     * Get media library
     */
    getMediaLibrary(filters?: MediaFilters): Promise<MediaItem[]>;
  };

  // System Monitoring
  monitoring: {
    /**
     * Get system health
     */
    getSystemHealth(): Promise<SystemHealth>;

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(period: DateRange): Promise<PerformanceMetrics>;

    /**
     * Get error logs
     */
    getErrorLogs(filters?: LogFilters): Promise<ErrorLog[]>;

    /**
     * Get audit trail
     */
    getAuditTrail(filters?: AuditFilters): Promise<AuditEntry[]>;

    /**
     * Get database status
     */
    getDatabaseStatus(): Promise<DatabaseStatus>;

    /**
     * Get API usage statistics
     */
    getAPIUsage(period: DateRange): Promise<APIUsageStats>;

    /**
     * Run system diagnostics
     */
    runDiagnostics(): Promise<DiagnosticResult>;

    /**
     * Get backup status
     */
    getBackupStatus(): Promise<BackupStatus>;

    /**
     * Create manual backup
     */
    createBackup(type: 'full' | 'incremental'): Promise<BackupResult>;
  };

  // Notification Management
  notifications: {
    /**
     * Get notifications
     */
    getNotifications(
      userId?: string,
      filters?: NotificationFilters
    ): Promise<Notification[]>;

    /**
     * Send notification
     */
    sendNotification(
      notification: SendNotificationData
    ): Promise<NotificationResult>;

    /**
     * Mark as read
     */
    markAsRead(notificationIds: string[]): Promise<MarkReadResult>;

    /**
     * Get notification templates
     */
    getTemplates(): Promise<NotificationTemplate[]>;

    /**
     * Create template
     */
    createTemplate(
      template: CreateTemplateData
    ): Promise<TemplateResult>;

    /**
     * Update template
     */
    updateTemplate(
      templateId: string,
      updates: UpdateTemplateData
    ): Promise<TemplateResult>;

    /**
     * Configure notification rules
     */
    configureRules(rules: NotificationRule[]): Promise<RuleResult>;

    /**
     * Get notification statistics
     */
    getStatistics(period: DateRange): Promise<NotificationStats>;
  };

  // Integration Management
  integrations: {
    /**
     * Get available integrations
     */
    getAvailable(): Promise<Integration[]>;

    /**
     * Get active integrations
     */
    getActive(): Promise<ActiveIntegration[]>;

    /**
     * Enable integration
     */
    enable(
      integrationId: string,
      config: IntegrationConfig
    ): Promise<IntegrationResult>;

    /**
     * Disable integration
     */
    disable(integrationId: string): Promise<IntegrationResult>;

    /**
     * Update integration config
     */
    updateConfig(
      integrationId: string,
      config: Partial<IntegrationConfig>
    ): Promise<IntegrationResult>;

    /**
     * Test integration connection
     */
    testConnection(integrationId: string): Promise<ConnectionResult>;

    /**
     * Get integration logs
     */
    getLogs(
      integrationId: string,
      filters?: LogFilters
    ): Promise<IntegrationLog[]>;

    /**
     * Sync data
     */
    syncData(
      integrationId: string,
      syncType: 'full' | 'incremental'
    ): Promise<SyncResult>;
  };

  // Task Management
  tasks: {
    /**
     * Get tasks
     */
    getTasks(filters?: TaskFilters): Promise<AdminTask[]>;

    /**
     * Create task
     */
    createTask(task: CreateTaskData): Promise<TaskResult>;

    /**
     * Update task
     */
    updateTask(taskId: string, updates: UpdateTaskData): Promise<TaskResult>;

    /**
     * Complete task
     */
    completeTask(taskId: string, notes?: string): Promise<TaskResult>;

    /**
     * Assign task
     */
    assignTask(taskId: string, assigneeId: string): Promise<AssignmentResult>;

    /**
     * Get task comments
     */
    getTaskComments(taskId: string): Promise<TaskComment[]>;

    /**
     * Add task comment
     */
    addTaskComment(
      taskId: string,
      comment: string,
      attachments?: string[]
    ): Promise<CommentResult>;

    /**
     * Get team workload
     */
    getTeamWorkload(): Promise<TeamWorkload>;
  };
}

// Supporting Types
export interface DashboardOverview {
  period: DateRange;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
    customerSatisfaction: number;
  };
  trends: {
    revenue: TrendData;
    bookings: TrendData;
    customers: TrendData;
  };
  quickStats: QuickStat[];
  recentActivity: ActivityItem[];
  topServices: ServiceStat[];
  upcomingEvents: EventItem[];
}

export interface RealTimeMetrics {
  activeUsers: number;
  todayBookings: number;
  todayRevenue: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface KPIDashboard {
  period: DateRange;
  kpis: KPI[];
  targets: KPITarget[];
  alerts: KPIAlert[];
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  unit: string;
  format: 'number' | 'currency' | 'percentage';
}

export interface KPITarget {
  kpiId: string;
  target: number;
  achievement: number;
  achievementRate: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface KPIAlert {
  kpiId: string;
  type: 'threshold' | 'trend' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  triggeredAt: Date;
}

export interface Alert {
  id: string;
  type: 'system' | 'business' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertResult {
  success: boolean;
  error?: string;
}

export interface WidgetConfig {
  timeframe?: string;
  filters?: Record<string, any>;
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
}

export interface WidgetData {
  widgetId: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  data: any;
  lastUpdated: Date;
  config: WidgetConfig;
}

export interface DashboardLayout {
  userId: string;
  layout: {
    widgets: {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    columns: number;
  };
  savedAt: Date;
}

export interface LayoutResult {
  success: boolean;
  error?: string;
}

export type ReportType =
  | 'revenue'
  | 'bookings'
  | 'customers'
  | 'staff'
  | 'services'
  | 'inventory'
  | 'financial'
  | 'marketing';

export interface ReportFilters {
  serviceIds?: string[];
  staffIds?: string[];
  customerSegments?: string[];
  categories?: string[];
  tags?: string[];
}

export interface BusinessReport {
  id: string;
  type: ReportType;
  title: string;
  period: DateRange;
  generatedAt: Date;
  sections: ReportSection[];
  summary: ReportSummary;
  insights: ReportInsight[];
  recommendations: string[];
}

export interface ReportSection {
  title: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  data: any;
  description?: string;
}

export interface ReportSummary {
  keyMetrics: {
    name: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  highlights: string[];
  concerns: string[];
}

export interface ReportInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionable: boolean;
}

export interface RevenueAnalytics {
  period: DateRange;
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  revenueByService: ServiceRevenue[];
  revenueByStaff: StaffRevenue[];
  revenueByDay: DailyRevenue[];
  growth: {
    monthOverMonth: number;
    yearOverYear: number;
    quarterly: number;
  };
  forecast: RevenueForecast;
}

export interface ServiceRevenue {
  serviceId: string;
  serviceName: string;
  revenue: number;
  bookings: number;
  averageValue: number;
  growth: number;
}

export interface StaffRevenue {
  staffId: string;
  staffName: string;
  revenue: number;
  bookings: number;
  averageValue: number;
  commission: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
  averageValue: number;
}

export interface RevenueForecast {
  period: DateRange;
  predictedRevenue: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
  }[];
}

export interface CustomerAnalytics {
  period: DateRange;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  churnedCustomers: number;
  customerGrowthRate: number;
  retentionRate: number;
  churnRate: number;
  averageLifetimeValue: number;
  customerSegments: SegmentAnalytics[];
  acquisitionChannels: ChannelAnalytics[];
}

export interface SegmentAnalytics {
  segmentId: string;
  segmentName: string;
  customerCount: number;
  revenue: number;
  averageValue: number;
  retentionRate: number;
  growth: number;
}

export interface ChannelAnalytics {
  channel: string;
  customerCount: number;
  acquisitionCost: number;
  lifetimeValue: number;
  roi: number;
}

export interface ServicePerformance {
  period: DateRange;
  services: {
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
    rating: number;
    utilizationRate: number;
    noShowRate: number;
    cancellationRate: number;
    repeatBookingRate: number;
    profitMargin: number;
  }[];
  topPerformers: string[];
  underperformers: string[];
  recommendations: string[];
}

export interface StaffPerformance {
  period: DateRange;
  staff: {
    staffId: string;
    staffName: string;
    bookings: number;
    revenue: number;
    rating: number;
    utilizationRate: number;
    noShowRate: number;
    onTimeRate: number;
    rebookingRate: number;
    commission: number;
    hours: number;
    efficiency: number;
  }[];
  teamAverages: {
    rating: number;
    utilizationRate: number;
    efficiency: number;
    revenue: number;
  };
  improvements: {
    staffId: string;
    recommendations: string[];
  }[];
}

export interface BookingAnalytics {
  period: DateRange;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShows: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageBookingValue: number;
  bookingsByDay: {
    date: string;
    bookings: number;
    revenue: number;
  }[];
  bookingsByService: {
    serviceId: string;
    serviceName: string;
    bookings: number;
    percentage: number;
  }[];
  peakTimes: {
    hour: number;
    bookings: number;
    utilization: number;
  }[];
  seasonality: {
    month: string;
    bookings: number;
    trend: number;
  }[];
}

export interface FinancialSummary {
  period: DateRange;
  income: {
    services: number;
    products: number;
    other: number;
    total: number;
  };
  expenses: {
    salaries: number;
    supplies: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    total: number;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    net: number;
  };
  breakdown: {
    date: string;
    income: number;
    expenses: number;
    profit: number;
  }[];
}

export interface TrendAnalysis {
  metric: string;
  period: DateRange;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number; // 0-1
  data: {
    date: string;
    value: number;
    predicted?: number;
  }[];
  seasonality: {
    detected: boolean;
    pattern?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    strength?: number;
  };
  anomalies: {
    date: string;
    value: number;
    expectedValue: number;
    deviation: number;
    significance: 'low' | 'medium' | 'high';
  }[];
  forecast: {
    period: DateRange;
    values: {
      date: string;
      value: number;
      confidence: number;
    }[];
  };
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
}

export interface ScheduledReport {
  name: string;
  type: ReportType;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string; // HH:mm format
  };
  recipients: string[];
  filters?: ReportFilters;
  format: 'pdf' | 'excel' | 'csv';
  active: boolean;
}

export interface ScheduleResult {
  success: boolean;
  scheduleId?: string;
  error?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: Permission[];
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface UserFilters {
  role?: string;
  status?: UserStatus;
  department?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
  phone?: string;
  department?: string;
  permissions?: string[];
  sendWelcomeEmail: boolean;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  status?: UserStatus;
  isActive?: boolean;
}

export interface UserResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface PasswordResetResult {
  success: boolean;
  temporaryPassword?: string;
  resetToken?: string;
  error?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface PermissionResult {
  success: boolean;
  permissions?: Permission[];
  error?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

export interface ActivityFilters {
  action?: string;
  resource?: string;
  dateRange?: DateRange;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface BulkUpdateData {
  status?: UserStatus;
  role?: string;
  department?: string;
  isActive?: boolean;
}

export interface BulkResult {
  success: boolean;
  updated: number;
  failed: number;
  errors: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isBuiltIn: boolean;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleData extends Partial<CreateRoleData> {}

export interface RoleResult {
  success: boolean;
  role?: Role;
  error?: string;
}

export interface AssignmentResult {
  success: boolean;
  error?: string;
}

export interface RemovalResult {
  success: boolean;
  error?: string;
}

export interface SystemSettings {
  general: {
    siteName: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    currency: string;
    language: string;
    maintenanceMode: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: PasswordPolicy;
    twoFactorRequired: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  email: {
    provider: string;
    fromName: string;
    fromEmail: string;
    replyToEmail: string;
    smtpSettings?: SMTPSettings;
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    storageLocation: string;
  };
  api: {
    rateLimitEnabled: boolean;
    requestsPerMinute: number;
    corsEnabled: boolean;
    allowedOrigins: string[];
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expiryDays: number;
}

export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'none' | 'tls' | 'ssl';
}

export interface BusinessSettings {
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
    logo?: string;
  };
  hours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  booking: {
    advanceBookingDays: number;
    cancellationPolicy: string;
    noShowPolicy: string;
    reminderSettings: ReminderSettings;
    bufferTime: number;
  };
  payment: {
    currencies: string[];
    defaultCurrency: string;
    acceptCash: boolean;
    acceptCard: boolean;
    requireDeposit: boolean;
    depositPercentage: number;
  };
  loyalty: {
    enabled: boolean;
    pointsPerDollar: number;
    welcomeBonus: number;
    referralBonus: number;
    tiers: LoyaltyTier[];
  };
}

export interface ReminderSettings {
  email: {
    enabled: boolean;
    times: number[]; // hours before appointment
  };
  sms: {
    enabled: boolean;
    times: number[];
  };
}

export interface LoyaltyTier {
  name: string;
  minimumPoints: number;
  benefits: string[];
  multiplier: number;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    newBooking: boolean;
    cancellation: boolean;
    reminder: boolean;
    payment: boolean;
    review: boolean;
  };
  sms: {
    enabled: boolean;
    newBooking: boolean;
    reminder: boolean;
    confirmation: boolean;
  };
  push: {
    enabled: boolean;
    newBooking: boolean;
    reminder: boolean;
    updates: boolean;
  };
  slack: {
    enabled: boolean;
    webhook?: string;
    newBooking: boolean;
    alerts: boolean;
  };
}

export interface IntegrationSettings {
  stripe: {
    enabled: boolean;
    publicKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  aws: {
    enabled: boolean;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    s3Bucket?: string;
  };
  cognito: {
    enabled: boolean;
    userPoolId?: string;
    clientId?: string;
    region?: string;
  };
  analytics: {
    google: {
      enabled: boolean;
      trackingId?: string;
    };
    facebook: {
      enabled: boolean;
      pixelId?: string;
    };
  };
  calendar: {
    google: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
    };
    outlook: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
    };
  };
}

export interface SettingsResult {
  success: boolean;
  error?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export type ContentType = 'page' | 'blog' | 'service' | 'promotion' | 'email_template';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: ContentStatus;
  author: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  metadata?: Record<string, any>;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface CreateContentData {
  type: ContentType;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  publishNow?: boolean;
}

export interface UpdateContentData extends Partial<CreateContentData> {
  status?: ContentStatus;
}

export interface ContentResult {
  success: boolean;
  content?: ContentItem;
  error?: string;
}

export interface PublishResult {
  success: boolean;
  publishedAt?: Date;
  error?: string;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  isCurrent: boolean;
}

export interface RestoreResult {
  success: boolean;
  newVersion?: number;
  error?: string;
}

export interface MediaMetadata {
  title?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
}

export interface MediaResult {
  success: boolean;
  media?: MediaItem;
  error?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: MediaMetadata;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface MediaFilters {
  type?: 'image' | 'video' | 'audio' | 'document';
  tags?: string[];
  uploadedBy?: string;
  dateRange?: DateRange;
  limit?: number;
  offset?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastUpdated: Date;
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number;
    error?: string;
  }[];
  resources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

export interface PerformanceMetrics {
  period: DateRange;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errors: {
    rate: number;
    count: number;
    types: Record<string, number>;
  };
  availability: number;
  trends: {
    date: string;
    responseTime: number;
    throughput: number;
    errorRate: number;
  }[];
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface LogFilters {
  level?: string;
  dateRange?: DateRange;
  userId?: string;
  resolved?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  dateRange?: DateRange;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface DatabaseStatus {
  connected: boolean;
  responseTime: number;
  activeConnections: number;
  maxConnections: number;
  size: number;
  freeSpace: number;
  lastBackup?: Date;
  replicationStatus?: 'up_to_date' | 'lagging' | 'failed';
}

export interface APIUsageStats {
  period: DateRange;
  totalRequests: number;
  uniqueClients: number;
  averageResponseTime: number;
  errorRate: number;
  endpoints: {
    path: string;
    method: string;
    requests: number;
    averageResponseTime: number;
    errorRate: number;
  }[];
  clients: {
    clientId: string;
    requests: number;
    errorRate: number;
    rateLimitHits: number;
  }[];
}

export interface DiagnosticResult {
  overall: 'healthy' | 'issues' | 'critical';
  checks: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
    details?: Record<string, any>;
  }[];
  recommendations: string[];
  runAt: Date;
}

export interface BackupStatus {
  lastBackup?: Date;
  nextBackup?: Date;
  backupSize?: number;
  status: 'up_to_date' | 'overdue' | 'failed' | 'in_progress';
  retentionDays: number;
  availableBackups: {
    id: string;
    createdAt: Date;
    size: number;
    type: 'full' | 'incremental';
  }[];
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  size?: number;
  duration?: number;
  error?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'booking' | 'payment' | 'review' | 'promotion';
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationFilters {
  type?: string;
  category?: string;
  read?: boolean;
  dateRange?: DateRange;
  limit?: number;
  offset?: number;
}

export interface SendNotificationData {
  userIds: string[];
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'booking' | 'payment' | 'review' | 'promotion';
  actionUrl?: string;
  metadata?: Record<string, any>;
  channels: ('in_app' | 'email' | 'sms' | 'push')[];
}

export interface NotificationResult {
  success: boolean;
  sentCount?: number;
  failedCount?: number;
  errors?: string[];
}

export interface MarkReadResult {
  success: boolean;
  markedCount?: number;
  error?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject?: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateData {
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject?: string;
  content: string;
  variables: string[];
  category: string;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  isActive?: boolean;
}

export interface TemplateResult {
  success: boolean;
  template?: NotificationTemplate;
  error?: string;
}

export interface NotificationRule {
  trigger: string;
  conditions: Record<string, any>;
  templateId: string;
  channels: string[];
  enabled: boolean;
}

export interface RuleResult {
  success: boolean;
  rulesConfigured?: number;
  error?: string;
}

export interface NotificationStats {
  period: DateRange;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  byChannel: Record<string, {
    sent: number;
    delivered: number;
    deliveryRate: number;
  }>;
  byCategory: Record<string, number>;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'payment' | 'analytics' | 'communication' | 'calendar' | 'storage';
  provider: string;
  version: string;
  documentation: string;
  configFields: IntegrationField[];
  capabilities: string[];
  supported: boolean;
}

export interface IntegrationField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select';
  required: boolean;
  description?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface ActiveIntegration {
  id: string;
  integrationId: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  config: IntegrationConfig;
  lastSync?: Date;
  nextSync?: Date;
  errorMessage?: string;
  enabledAt: Date;
}

export interface IntegrationConfig {
  [key: string]: any;
}

export interface IntegrationResult {
  success: boolean;
  integration?: ActiveIntegration;
  error?: string;
}

export interface ConnectionResult {
  success: boolean;
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  type: 'sync' | 'webhook' | 'api_call' | 'error';
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsDeleted?: number;
  errors?: string[];
  duration?: number;
}

export interface AdminTask {
  id: string;
  title: string;
  description: string;
  type: 'maintenance' | 'review' | 'approval' | 'investigation' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigneeId?: string;
  createdBy: string;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilters {
  type?: string;
  priority?: string;
  status?: string;
  assigneeId?: string;
  createdBy?: string;
  dueDateRange?: DateRange;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface CreateTaskData {
  title: string;
  description: string;
  type: 'maintenance' | 'review' | 'approval' | 'investigation' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface TaskResult {
  success: boolean;
  task?: AdminTask;
  error?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  attachments: string[];
  createdAt: Date;
}

export interface CommentResult {
  success: boolean;
  comment?: TaskComment;
  error?: string;
}

export interface TeamWorkload {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  members: {
    userId: string;
    userName: string;
    assignedTasks: number;
    completedTasks: number;
    overdueTask: number;
    workload: 'light' | 'normal' | 'heavy' | 'overloaded';
  }[];
  tasksByPriority: Record<string, number>;
  tasksByType: Record<string, number>;
  averageCompletionTime: number;
}

// Common Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TrendData {
  period: string;
  data: {
    date: string;
    value: number;
  }[];
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercentage: number;
}

export interface QuickStat {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'number' | 'currency' | 'percentage';
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'customer' | 'review';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ServiceStat {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
  growth: number;
}

export interface EventItem {
  id: string;
  title: string;
  type: 'appointment' | 'task' | 'reminder' | 'meeting';
  startTime: Date;
  endTime?: Date;
  description?: string;
}