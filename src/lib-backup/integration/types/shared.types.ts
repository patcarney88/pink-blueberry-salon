/**
 * Shared TypeScript Types
 *
 * Common types used across all teams to ensure consistency
 * and prevent type conflicts in cross-team integrations
 */

// ============================================================================
// COMMON DOMAIN TYPES
// ============================================================================

/**
 * Universal identifier type used across all systems
 */
export type EntityId = string;

/**
 * Timestamp types for consistent date handling
 */
export type Timestamp = Date;
export type ISODateString = string;

/**
 * Standard date range for analytics and filtering
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Pagination interface used across all list endpoints
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Pagination metadata returned with paginated results
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
  timestamp: Date;
}

/**
 * Standardized error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  validation?: ValidationError[];
}

/**
 * Field validation error
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

/**
 * Core user information shared across teams
 */
export interface BaseUser {
  id: EntityId;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Authentication session information
 */
export interface SessionInfo {
  userId: EntityId;
  sessionId: string;
  expiresAt: Timestamp;
  isActive: boolean;
  permissions: string[];
  roles: string[];
}

/**
 * Permission structure for authorization
 */
export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

/**
 * Role definition for RBAC
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// ============================================================================
// BUSINESS DOMAIN TYPES
// ============================================================================

/**
 * Service/Product category structure
 */
export interface Category {
  id: EntityId;
  name: string;
  description?: string;
  slug: string;
  parentId?: EntityId;
  imageUrl?: string;
  isActive: boolean;
}

/**
 * Tag structure for flexible categorization
 */
export interface Tag {
  id: EntityId;
  name: string;
  color?: string;
  category?: string;
}

/**
 * Address structure used across teams
 */
export interface Address {
  id?: EntityId;
  type?: 'billing' | 'shipping' | 'both';
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  phone?: string;
  isDefault?: boolean;
}

/**
 * Contact information structure
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: Address;
  website?: string;
  socialProfiles?: SocialProfile[];
}

/**
 * Social media profile
 */
export interface SocialProfile {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
  username: string;
  url: string;
  verified: boolean;
}

// ============================================================================
// FINANCIAL TYPES
// ============================================================================

/**
 * Money representation with currency
 */
export interface Money {
  amount: number;
  currency: string;
}

/**
 * Price structure with optional compare pricing
 */
export interface Price {
  base: Money;
  compare?: Money;
  discount?: {
    amount: Money;
    percentage: number;
    type: 'fixed' | 'percentage';
  };
}

/**
 * Tax line item
 */
export interface TaxLine {
  title: string;
  rate: number;
  amount: Money;
}

/**
 * Payment method information
 */
export interface PaymentMethod {
  id: EntityId;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash' | 'apple_pay' | 'google_pay';
  provider: string;
  isDefault: boolean;
  metadata?: Record<string, any>;
}

// ============================================================================
// SCHEDULING & TIME TYPES
// ============================================================================

/**
 * Time slot representation
 */
export interface TimeSlot {
  start: Timestamp;
  end: Timestamp;
  duration: number; // minutes
}

/**
 * Recurring schedule pattern
 */
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
  endDate?: Timestamp;
  occurrences?: number;
}

/**
 * Business hours for a specific day
 */
export interface BusinessHours {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
  breaks?: TimeSlot[];
}

/**
 * Weekly schedule
 */
export interface WeeklySchedule {
  monday: BusinessHours;
  tuesday: BusinessHours;
  wednesday: BusinessHours;
  thursday: BusinessHours;
  friday: BusinessHours;
  saturday: BusinessHours;
  sunday: BusinessHours;
}

// ============================================================================
// CONTENT & MEDIA TYPES
// ============================================================================

/**
 * Media/Image structure
 */
export interface MediaItem {
  id: EntityId;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: Timestamp;
}

/**
 * SEO metadata structure
 */
export interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

// ============================================================================
// ANALYTICS & METRICS TYPES
// ============================================================================

/**
 * Generic metric data point
 */
export interface MetricDataPoint {
  timestamp: Timestamp;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: number; // 0-1
  confidence: number; // 0-1
  changePercentage: number;
  significance: 'low' | 'medium' | 'high';
}

/**
 * Performance metrics structure
 */
export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  timestamp: Timestamp;
}

// ============================================================================
// NOTIFICATION & COMMUNICATION TYPES
// ============================================================================

/**
 * Notification channel types
 */
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';

/**
 * Communication preference
 */
export interface CommunicationPreference {
  channel: NotificationChannel;
  enabled: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  categories: string[];
}

/**
 * Notification template structure
 */
export interface NotificationTemplate {
  id: EntityId;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

// ============================================================================
// WORKFLOW & STATUS TYPES
// ============================================================================

/**
 * Generic workflow status
 */
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

/**
 * Approval status for workflow items
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

/**
 * Priority levels
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

/**
 * Generic status transition
 */
export interface StatusTransition {
  from: string;
  to: string;
  timestamp: Timestamp;
  userId?: EntityId;
  reason?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// SEARCH & FILTERING TYPES
// ============================================================================

/**
 * Search facet for filtered search results
 */
export interface SearchFacet {
  name: string;
  displayName: string;
  values: Array<{
    value: string;
    label: string;
    count: number;
  }>;
}

/**
 * Search criteria base
 */
export interface SearchCriteria {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pagination?: PaginationParams;
}

/**
 * Search result with facets
 */
export interface SearchResult<T> {
  items: T[];
  total: number;
  facets: SearchFacet[];
  suggestions?: string[];
  pagination: PaginationMeta;
}

// ============================================================================
// INTEGRATION & SYNC TYPES
// ============================================================================

/**
 * External system sync status
 */
export interface SyncStatus {
  lastSync: Timestamp;
  nextSync?: Timestamp;
  status: 'success' | 'failed' | 'in_progress' | 'pending';
  recordsSynced?: number;
  errors?: string[];
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  id: EntityId;
  event: string;
  source: string;
  timestamp: Timestamp;
  data: Record<string, any>;
  signature?: string;
}

/**
 * External system integration configuration
 */
export interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  webhookUrl?: string;
  syncFrequency?: 'manual' | 'hourly' | 'daily' | 'weekly';
  lastSync?: Timestamp;
  settings: Record<string, any>;
}

// ============================================================================
// AUDIT & COMPLIANCE TYPES
// ============================================================================

/**
 * Audit log entry
 */
export interface AuditEntry {
  id: EntityId;
  userId: EntityId;
  action: string;
  resource: string;
  resourceId?: EntityId;
  changes?: Record<string, {
    before: any;
    after: any;
  }>;
  ipAddress: string;
  userAgent: string;
  timestamp: Timestamp;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Data retention policy
 */
export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  archiveAfter?: number; // days
  deleteAfter?: number; // days
  conditions?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic key-value configuration
 */
export interface KeyValueConfig {
  [key: string]: string | number | boolean | null;
}

/**
 * File upload metadata
 */
export interface UploadMetadata {
  filename: string;
  mimeType: string;
  size: number;
  checksum?: string;
  uploadedBy: EntityId;
  uploadedAt: Timestamp;
}

/**
 * Geolocation coordinates
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

/**
 * Language/Locale settings
 */
export interface LocaleSettings {
  language: string;
  country: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
}

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Type guard for checking if a value is a valid EntityId
 */
export function isEntityId(value: any): value is EntityId {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for checking if a value is a valid Money object
 */
export function isMoney(value: any): value is Money {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.amount === 'number' &&
    typeof value.currency === 'string'
  );
}

/**
 * Type guard for checking if a value is a valid DateRange
 */
export function isDateRange(value: any): value is DateRange {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.start instanceof Date &&
    value.end instanceof Date &&
    value.start <= value.end
  );
}

/**
 * Type guard for checking if a value is a valid ApiResponse
 */
export function isApiResponse<T>(value: any): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.success === 'boolean' &&
    value.timestamp instanceof Date
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error codes used across teams
 */
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
} as const;

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

/**
 * Common time constants (in milliseconds)
 */
export const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;