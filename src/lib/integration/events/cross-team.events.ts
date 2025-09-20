/**
 * Cross-Team Event Definitions
 *
 * Event-driven communication patterns for seamless team coordination
 * Ensures loose coupling while maintaining strong integration
 */

import type { EntityId, Timestamp } from '../types/shared.types';

// ============================================================================
// BASE EVENT TYPES
// ============================================================================

/**
 * Base event structure for all cross-team communications
 */
export interface BaseEvent {
  id: EntityId;
  type: string;
  source: TeamId;
  timestamp: Timestamp;
  version: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Event with typed payload
 */
export interface TypedEvent<TPayload = any> extends BaseEvent {
  payload: TPayload;
}

/**
 * Team identifiers for event routing
 */
export type TeamId = 'foundation' | 'database' | 'auth' | 'booking' | 'ecommerce' | 'crm' | 'admin';

/**
 * Event priority levels for processing order
 */
export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Event delivery guarantees
 */
export type DeliveryGuarantee = 'at_most_once' | 'at_least_once' | 'exactly_once';

// ============================================================================
// FOUNDATION TEAM EVENTS
// ============================================================================

export interface FoundationEvents {
  // Application lifecycle events
  'foundation.app.initialized': TypedEvent<{
    version: string;
    environment: string;
    features: string[];
    timestamp: Timestamp;
  }>;

  'foundation.app.health_check': TypedEvent<{
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, boolean>;
    uptime: number;
    timestamp: Timestamp;
  }>;

  // Theme and layout events
  'foundation.theme.updated': TypedEvent<{
    themeId: string;
    changes: Record<string, any>;
    affectedComponents: string[];
    timestamp: Timestamp;
  }>;

  'foundation.layout.registered': TypedEvent<{
    layoutId: string;
    name: string;
    path: string;
    metadata: Record<string, any>;
    timestamp: Timestamp;
  }>;

  // Component registry events
  'foundation.component.registered': TypedEvent<{
    componentName: string;
    version: string;
    dependencies: string[];
    timestamp: Timestamp;
  }>;
}

// ============================================================================
// DATABASE TEAM EVENTS
// ============================================================================

export interface DatabaseEvents {
  // Schema and migration events
  'database.schema.initialized': TypedEvent<{
    version: string;
    tables: string[];
    timestamp: Timestamp;
  }>;

  'database.migration.started': TypedEvent<{
    migrationId: string;
    version: string;
    description: string;
    timestamp: Timestamp;
  }>;

  'database.migration.completed': TypedEvent<{
    migrationId: string;
    version: string;
    duration: number;
    recordsAffected: number;
    timestamp: Timestamp;
  }>;

  'database.migration.failed': TypedEvent<{
    migrationId: string;
    error: string;
    rollbackRequired: boolean;
    timestamp: Timestamp;
  }>;

  // Connection and performance events
  'database.connection.established': TypedEvent<{
    connectionId: string;
    poolSize: number;
    timestamp: Timestamp;
  }>;

  'database.performance.alert': TypedEvent<{
    metric: 'slow_query' | 'high_cpu' | 'memory_pressure' | 'connection_limit';
    value: number;
    threshold: number;
    query?: string;
    timestamp: Timestamp;
  }>;

  // Data integrity events
  'database.integrity.violation': TypedEvent<{
    table: string;
    constraint: string;
    recordId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Timestamp;
  }>;

  'database.backup.completed': TypedEvent<{
    backupId: string;
    size: number;
    duration: number;
    location: string;
    timestamp: Timestamp;
  }>;
}

// ============================================================================
// AUTH TEAM EVENTS
// ============================================================================

export interface AuthEvents {
  // User authentication events
  'auth.user.signed_in': TypedEvent<{
    userId: EntityId;
    email: string;
    method: 'password' | 'oauth' | 'mfa';
    ipAddress: string;
    userAgent: string;
    timestamp: Timestamp;
  }>;

  'auth.user.signed_out': TypedEvent<{
    userId: EntityId;
    sessionId: string;
    reason: 'manual' | 'timeout' | 'revoked';
    timestamp: Timestamp;
  }>;

  'auth.user.signed_up': TypedEvent<{
    userId: EntityId;
    email: string;
    firstName: string;
    lastName: string;
    source: string;
    timestamp: Timestamp;
  }>;

  'auth.user.email_verified': TypedEvent<{
    userId: EntityId;
    email: string;
    timestamp: Timestamp;
  }>;

  // Session management events
  'auth.session.created': TypedEvent<{
    sessionId: string;
    userId: EntityId;
    expiresAt: Timestamp;
    ipAddress: string;
    timestamp: Timestamp;
  }>;

  'auth.session.expired': TypedEvent<{
    sessionId: string;
    userId: EntityId;
    reason: 'timeout' | 'inactivity' | 'security';
    timestamp: Timestamp;
  }>;

  // Permission and role events
  'auth.permission.granted': TypedEvent<{
    userId: EntityId;
    permission: string;
    resource: string;
    grantedBy: EntityId;
    timestamp: Timestamp;
  }>;

  'auth.role.assigned': TypedEvent<{
    userId: EntityId;
    roleId: string;
    roleName: string;
    assignedBy: EntityId;
    timestamp: Timestamp;
  }>;

  // Security events
  'auth.security.suspicious_activity': TypedEvent<{
    userId: EntityId;
    activityType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    ipAddress: string;
    details: Record<string, any>;
    timestamp: Timestamp;
  }>;

  'auth.security.account_locked': TypedEvent<{
    userId: EntityId;
    reason: string;
    lockDuration: number;
    timestamp: Timestamp;
  }>;

  'auth.mfa.enabled': TypedEvent<{
    userId: EntityId;
    method: 'totp' | 'sms' | 'email';
    timestamp: Timestamp;
  }>;
}

// ============================================================================
// BOOKING TEAM EVENTS
// ============================================================================

export interface BookingEvents {
  // Service management events
  'booking.service.created': TypedEvent<{
    serviceId: EntityId;
    name: string;
    category: string;
    duration: number;
    price: number;
    timestamp: Timestamp;
  }>;

  'booking.service.updated': TypedEvent<{
    serviceId: EntityId;
    changes: Record<string, any>;
    timestamp: Timestamp;
  }>;

  // Staff management events
  'booking.staff.availability_updated': TypedEvent<{
    staffId: EntityId;
    date: string;
    slots: Array<{
      start: string;
      end: string;
      available: boolean;
    }>;
    timestamp: Timestamp;
  }>;

  'booking.staff.unavailable': TypedEvent<{
    staffId: EntityId;
    startTime: Timestamp;
    endTime: Timestamp;
    reason: string;
    affectedBookings: EntityId[];
    timestamp: Timestamp;
  }>;

  // Booking lifecycle events
  'booking.created': TypedEvent<{
    bookingId: EntityId;
    customerId: EntityId;
    serviceId: EntityId;
    staffId: EntityId;
    startTime: Timestamp;
    endTime: Timestamp;
    price: number;
    status: string;
    timestamp: Timestamp;
  }>;

  'booking.confirmed': TypedEvent<{
    bookingId: EntityId;
    customerId: EntityId;
    confirmationNumber: string;
    timestamp: Timestamp;
  }>;

  'booking.cancelled': TypedEvent<{
    bookingId: EntityId;
    customerId: EntityId;
    reason: string;
    refundAmount?: number;
    timestamp: Timestamp;
  }>;

  'booking.completed': TypedEvent<{
    bookingId: EntityId;
    customerId: EntityId;
    serviceId: EntityId;
    staffId: EntityId;
    rating?: number;
    feedback?: string;
    revenue: number;
    timestamp: Timestamp;
  }>;

  'booking.no_show': TypedEvent<{
    bookingId: EntityId;
    customerId: EntityId;
    serviceId: EntityId;
    scheduledTime: Timestamp;
    timestamp: Timestamp;
  }>;

  // Waitlist events
  'booking.waitlist.added': TypedEvent<{
    waitlistId: EntityId;
    customerId: EntityId;
    serviceId: EntityId;
    preferredTimes: string[];
    priority: number;
    timestamp: Timestamp;
  }>;

  'booking.waitlist.slot_available': TypedEvent<{
    waitlistId: EntityId;
    customerId: EntityId;
    serviceId: EntityId;
    availableSlot: {
      start: Timestamp;
      end: Timestamp;
      staffId: EntityId;
    };
    timestamp: Timestamp;
  }>;

  // Real-time updates
  'booking.availability.changed': TypedEvent<{
    serviceId: EntityId;
    staffId: EntityId;
    date: string;
    availableSlots: Array<{
      start: string;
      end: string;
    }>;
    timestamp: Timestamp;
  }>;
}

// ============================================================================
// E-COMMERCE TEAM EVENTS
// ============================================================================

export interface EcommerceEvents {
  // Product management events
  'ecommerce.product.created': TypedEvent<{
    productId: EntityId;
    name: string;
    sku: string;
    categoryId: EntityId;
    price: number;
    timestamp: Timestamp;
  }>;

  'ecommerce.product.updated': TypedEvent<{
    productId: EntityId;
    changes: Record<string, any>;
    timestamp: Timestamp;
  }>;

  'ecommerce.inventory.low_stock': TypedEvent<{
    productId: EntityId;
    variantId: EntityId;
    currentStock: number;
    threshold: number;
    sku: string;
    timestamp: Timestamp;
  }>;

  'ecommerce.inventory.out_of_stock': TypedEvent<{
    productId: EntityId;
    variantId: EntityId;
    sku: string;
    lastSaleDate: Timestamp;
    timestamp: Timestamp;
  }>;

  // Cart events
  'ecommerce.cart.item_added': TypedEvent<{
    cartId: EntityId;
    customerId: EntityId;
    productId: EntityId;
    variantId: EntityId;
    quantity: number;
    price: number;
    timestamp: Timestamp;
  }>;

  'ecommerce.cart.abandoned': TypedEvent<{
    cartId: EntityId;
    customerId: EntityId;
    value: number;
    itemCount: number;
    lastActivity: Timestamp;
    timestamp: Timestamp;
  }>;

  // Order events
  'ecommerce.order.created': TypedEvent<{
    orderId: EntityId;
    orderNumber: string;
    customerId: EntityId;
    total: number;
    currency: string;
    items: Array<{
      productId: EntityId;
      quantity: number;
      price: number;
    }>;
    timestamp: Timestamp;
  }>;

  'ecommerce.order.paid': TypedEvent<{
    orderId: EntityId;
    paymentId: EntityId;
    amount: number;
    currency: string;
    paymentMethod: string;
    timestamp: Timestamp;
  }>;

  'ecommerce.order.shipped': TypedEvent<{
    orderId: EntityId;
    shipmentId: EntityId;
    trackingNumber: string;
    carrier: string;
    estimatedDelivery: Timestamp;
    timestamp: Timestamp;
  }>;

  'ecommerce.order.delivered': TypedEvent<{
    orderId: EntityId;
    deliveryDate: Timestamp;
    recipient: string;
    timestamp: Timestamp;
  }>;

  'ecommerce.order.returned': TypedEvent<{
    orderId: EntityId;
    returnId: EntityId;
    reason: string;
    refundAmount: number;
    items: EntityId[];
    timestamp: Timestamp;
  }>;

  // Payment events
  'ecommerce.payment.failed': TypedEvent<{
    orderId: EntityId;
    paymentIntentId: string;
    error: string;
    amount: number;
    timestamp: Timestamp;
  }>;

  'ecommerce.refund.issued': TypedEvent<{
    orderId: EntityId;
    refundId: EntityId;
    amount: number;
    reason: string;
    timestamp: Timestamp;
  }>;

  // Promotion events
  'ecommerce.promotion.applied': TypedEvent<{
    promotionId: EntityId;
    customerId: EntityId;
    orderId: EntityId;
    discountAmount: number;
    code: string;
    timestamp: Timestamp;
  }>;
}

// ============================================================================
// CRM TEAM EVENTS
// ============================================================================

export interface CRMEvents {
  // Customer lifecycle events
  'crm.customer.created': TypedEvent<{
    customerId: EntityId;
    email: string;
    firstName: string;
    lastName: string;
    source: string;
    timestamp: Timestamp;
  }>;

  'crm.customer.updated': TypedEvent<{
    customerId: EntityId;
    changes: Record<string, any>;
    timestamp: Timestamp;
  }>;

  'crm.customer.merged': TypedEvent<{
    primaryCustomerId: EntityId;
    mergedCustomerId: EntityId;
    dataConflicts: Record<string, any>;
    timestamp: Timestamp;
  }>;

  // Segmentation events
  'crm.customer.segment_added': TypedEvent<{
    customerId: EntityId;
    segmentId: EntityId;
    segmentName: string;
    reason: 'manual' | 'automatic' | 'rule_based';
    timestamp: Timestamp;
  }>;

  'crm.segment.auto_updated': TypedEvent<{
    segmentId: EntityId;
    segmentName: string;
    customersAdded: number;
    customersRemoved: number;
    timestamp: Timestamp;
  }>;

  // Communication events
  'crm.communication.sent': TypedEvent<{
    communicationId: EntityId;
    customerId: EntityId;
    type: 'email' | 'sms' | 'push';
    template: string;
    subject?: string;
    timestamp: Timestamp;
  }>;

  'crm.communication.delivered': TypedEvent<{
    communicationId: EntityId;
    customerId: EntityId;
    deliveredAt: Timestamp;
    timestamp: Timestamp;
  }>;

  'crm.communication.opened': TypedEvent<{
    communicationId: EntityId;
    customerId: EntityId;
    openedAt: Timestamp;
    timestamp: Timestamp;
  }>;

  'crm.communication.clicked': TypedEvent<{
    communicationId: EntityId;
    customerId: EntityId;
    linkUrl: string;
    clickedAt: Timestamp;
    timestamp: Timestamp;
  }>;

  // Loyalty events
  'crm.loyalty.points_awarded': TypedEvent<{
    customerId: EntityId;
    points: number;
    reason: string;
    referenceId?: EntityId;
    newBalance: number;
    timestamp: Timestamp;
  }>;

  'crm.loyalty.points_redeemed': TypedEvent<{
    customerId: EntityId;
    points: number;
    reward: string;
    orderId?: EntityId;
    newBalance: number;
    timestamp: Timestamp;
  }>;

  'crm.loyalty.tier_upgraded': TypedEvent<{
    customerId: EntityId;
    oldTier: string;
    newTier: string;
    benefits: string[];
    timestamp: Timestamp;
  }>;

  // Support events
  'crm.support.ticket_created': TypedEvent<{
    ticketId: EntityId;
    customerId: EntityId;
    subject: string;
    priority: string;
    category: string;
    timestamp: Timestamp;
  }>;

  'crm.support.ticket_resolved': TypedEvent<{
    ticketId: EntityId;
    customerId: EntityId;
    resolutionTime: number;
    satisfaction?: number;
    timestamp: Timestamp;
  }>;

  // Feedback events
  'crm.feedback.submitted': TypedEvent<{
    feedbackId: EntityId;
    customerId: EntityId;
    type: 'review' | 'complaint' | 'suggestion';
    rating?: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    timestamp: Timestamp;
  }>;

  'crm.feedback.responded': TypedEvent<{
    feedbackId: EntityId;
    customerId: EntityId;
    responseTime: number;
    isPublic: boolean;
    timestamp: Timestamp;
  }>;

  // Analytics events
  'crm.analytics.churn_risk': TypedEvent<{
    customerId: EntityId;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    factors: string[];
    timestamp: Timestamp;
  }>;

  'crm.analytics.ltv_updated': TypedEvent<{
    customerId: EntityId;
    previousValue: number;
    newValue: number;
    factors: Record<string, number>;
    timestamp: Timestamp;
  }>;
}

// ============================================================================
// ADMIN TEAM EVENTS
// ============================================================================

export interface AdminEvents {
  // System monitoring events
  'admin.system.health_check': TypedEvent<{
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, {
      status: string;
      responseTime: number;
      error?: string;
    }>;
    resources: {
      cpu: number;
      memory: number;
      disk: number;
    };
    timestamp: Timestamp;
  }>;

  'admin.system.alert_triggered': TypedEvent<{
    alertId: EntityId;
    type: 'system' | 'business' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    source: string;
    timestamp: Timestamp;
  }>;

  // User management events
  'admin.user.created': TypedEvent<{
    userId: EntityId;
    email: string;
    role: string;
    permissions: string[];
    createdBy: EntityId;
    timestamp: Timestamp;
  }>;

  'admin.user.permissions_updated': TypedEvent<{
    userId: EntityId;
    oldPermissions: string[];
    newPermissions: string[];
    updatedBy: EntityId;
    timestamp: Timestamp;
  }>;

  'admin.user.deactivated': TypedEvent<{
    userId: EntityId;
    reason: string;
    deactivatedBy: EntityId;
    timestamp: Timestamp;
  }>;

  // Configuration events
  'admin.settings.updated': TypedEvent<{
    section: string;
    changes: Record<string, any>;
    updatedBy: EntityId;
    timestamp: Timestamp;
  }>;

  'admin.integration.enabled': TypedEvent<{
    integrationId: string;
    integrationName: string;
    config: Record<string, any>;
    enabledBy: EntityId;
    timestamp: Timestamp;
  }>;

  'admin.integration.failed': TypedEvent<{
    integrationId: string;
    error: string;
    lastSuccessful: Timestamp;
    timestamp: Timestamp;
  }>;

  // Backup and maintenance events
  'admin.backup.started': TypedEvent<{
    backupId: EntityId;
    type: 'full' | 'incremental';
    estimatedDuration: number;
    timestamp: Timestamp;
  }>;

  'admin.backup.completed': TypedEvent<{
    backupId: EntityId;
    size: number;
    duration: number;
    location: string;
    timestamp: Timestamp;
  }>;

  'admin.maintenance.scheduled': TypedEvent<{
    maintenanceId: EntityId;
    description: string;
    scheduledStart: Timestamp;
    estimatedDuration: number;
    affectedServices: string[];
    timestamp: Timestamp;
  }>;

  // Performance events
  'admin.performance.degradation': TypedEvent<{
    metric: string;
    currentValue: number;
    threshold: number;
    severity: 'warning' | 'critical';
    affectedComponents: string[];
    timestamp: Timestamp;
  }>;

  'admin.performance.recovery': TypedEvent<{
    metric: string;
    recoveredValue: number;
    duration: number;
    timestamp: Timestamp;
  }>;

  // Report events
  'admin.report.generated': TypedEvent<{
    reportId: EntityId;
    type: string;
    period: {
      start: Timestamp;
      end: Timestamp;
    };
    recipients: string[];
    timestamp: Timestamp;
  }>;
}

// ============================================================================
// EVENT AGGREGATION TYPES
// ============================================================================

/**
 * All team events combined for type safety
 */
export type AllEvents =
  & FoundationEvents
  & DatabaseEvents
  & AuthEvents
  & BookingEvents
  & EcommerceEvents
  & CRMEvents
  & AdminEvents;

/**
 * Union type of all event names
 */
export type EventName = keyof AllEvents;

/**
 * Event routing configuration
 */
export interface EventRoute {
  eventName: EventName;
  source: TeamId;
  targets: TeamId[];
  priority: EventPriority;
  deliveryGuarantee: DeliveryGuarantee;
  timeout: number; // seconds
  retries: number;
  deadLetterQueue: boolean;
}

/**
 * Event subscription configuration
 */
export interface EventSubscription {
  subscriberId: string;
  eventPatterns: string[]; // glob patterns
  handler: string; // function name or endpoint
  filterCriteria?: Record<string, any>;
  batchSize?: number;
  maxWaitTime?: number; // seconds
  deadLetterQueue?: string;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number; // seconds
  };
}

/**
 * Event processing metrics
 */
export interface EventMetrics {
  eventName: EventName;
  source: TeamId;
  target: TeamId;
  count: number;
  averageProcessingTime: number; // ms
  errorRate: number; // 0-1
  lastProcessed: Timestamp;
  throughput: number; // events/second
}

/**
 * Event store configuration
 */
export interface EventStore {
  type: 'memory' | 'redis' | 'kafka' | 'postgresql';
  config: Record<string, any>;
  retention: {
    duration: number; // days
    policy: 'time' | 'size' | 'count';
    archival: boolean;
  };
  partitioning: {
    strategy: 'team' | 'event_type' | 'time' | 'hash';
    partitions: number;
  };
}

// ============================================================================
// EVENT UTILITIES
// ============================================================================

/**
 * Create a typed event with automatic metadata
 */
export function createEvent<T extends EventName>(
  type: T,
  source: TeamId,
  payload: AllEvents[T]['payload'],
  metadata?: Record<string, any>
): AllEvents[T] {
  return {
    id: generateEventId(),
    type,
    source,
    timestamp: new Date(),
    version: '1.0.0',
    payload,
    metadata,
  } as AllEvents[T];
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Event pattern matcher for subscriptions
 */
export function matchesPattern(eventName: string, pattern: string): boolean {
  const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
  return regex.test(eventName);
}

/**
 * Get events by team
 */
export function getEventsByTeam(team: TeamId): string[] {
  const prefix = team === 'foundation' ? 'foundation.' :
                 team === 'database' ? 'database.' :
                 team === 'auth' ? 'auth.' :
                 team === 'booking' ? 'booking.' :
                 team === 'ecommerce' ? 'ecommerce.' :
                 team === 'crm' ? 'crm.' :
                 team === 'admin' ? 'admin.' : '';

  // This would be implemented with actual event registry
  return []; // Placeholder
}

/**
 * Validate event payload structure
 */
export function validateEvent<T extends EventName>(
  eventName: T,
  payload: any
): payload is AllEvents[T]['payload'] {
  // This would implement actual schema validation
  return true; // Placeholder
}