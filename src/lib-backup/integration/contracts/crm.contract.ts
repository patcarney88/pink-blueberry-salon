/**
 * CRM System Team API Contract
 *
 * Team Size: 12 agents
 * Purpose: Customer relationship management, analytics, communication
 * Dependencies: Foundation Team (✅ completed), Database Team, Auth Team
 */

export interface CRMContract {
  // Customer Management
  customers: {
    /**
     * Get all customers
     */
    getAll(filters?: CustomerFilters): Promise<Customer[]>;

    /**
     * Get customer by ID
     */
    getById(customerId: string): Promise<Customer | null>;

    /**
     * Search customers
     */
    search(criteria: CustomerSearchCriteria): Promise<CustomerSearchResult>;

    /**
     * Create new customer
     */
    create(customer: CreateCustomerData): Promise<CustomerResult>;

    /**
     * Update customer
     */
    update(
      customerId: string,
      updates: UpdateCustomerData
    ): Promise<CustomerResult>;

    /**
     * Merge customers
     */
    merge(
      primaryCustomerId: string,
      secondaryCustomerId: string
    ): Promise<MergeResult>;

    /**
     * Archive customer
     */
    archive(customerId: string, reason: string): Promise<ArchiveResult>;

    /**
     * Get customer timeline
     */
    getTimeline(customerId: string): Promise<CustomerTimeline>;

    /**
     * Get customer preferences
     */
    getPreferences(customerId: string): Promise<CustomerPreferences>;

    /**
     * Update preferences
     */
    updatePreferences(
      customerId: string,
      preferences: CustomerPreferences
    ): Promise<PreferencesResult>;
  };

  // Contact Management
  contacts: {
    /**
     * Add contact to customer
     */
    add(
      customerId: string,
      contact: ContactData
    ): Promise<ContactResult>;

    /**
     * Update contact
     */
    update(
      contactId: string,
      updates: UpdateContactData
    ): Promise<ContactResult>;

    /**
     * Remove contact
     */
    remove(contactId: string): Promise<RemovalResult>;

    /**
     * Get customer contacts
     */
    getCustomerContacts(customerId: string): Promise<Contact[]>;

    /**
     * Log interaction
     */
    logInteraction(
      customerId: string,
      interaction: InteractionData
    ): Promise<InteractionResult>;

    /**
     * Get interaction history
     */
    getInteractionHistory(
      customerId: string,
      filters?: InteractionFilters
    ): Promise<Interaction[]>;
  };

  // Customer Segmentation
  segmentation: {
    /**
     * Get all segments
     */
    getSegments(): Promise<CustomerSegment[]>;

    /**
     * Create segment
     */
    createSegment(segment: CreateSegmentData): Promise<SegmentResult>;

    /**
     * Update segment
     */
    updateSegment(
      segmentId: string,
      updates: UpdateSegmentData
    ): Promise<SegmentResult>;

    /**
     * Delete segment
     */
    deleteSegment(segmentId: string): Promise<DeleteResult>;

    /**
     * Get customers in segment
     */
    getCustomersInSegment(
      segmentId: string,
      limit?: number,
      offset?: number
    ): Promise<Customer[]>;

    /**
     * Add customer to segment
     */
    addToSegment(
      customerId: string,
      segmentId: string
    ): Promise<SegmentMembershipResult>;

    /**
     * Remove from segment
     */
    removeFromSegment(
      customerId: string,
      segmentId: string
    ): Promise<SegmentMembershipResult>;

    /**
     * Auto-segment customers
     */
    autoSegment(): Promise<AutoSegmentResult>;
  };

  // Communication
  communication: {
    /**
     * Send email
     */
    sendEmail(
      recipients: string[],
      template: EmailTemplate,
      data?: Record<string, any>
    ): Promise<EmailResult>;

    /**
     * Send SMS
     */
    sendSMS(
      phoneNumbers: string[],
      message: string,
      templateId?: string
    ): Promise<SMSResult>;

    /**
     * Create email campaign
     */
    createEmailCampaign(
      campaign: CreateCampaignData
    ): Promise<CampaignResult>;

    /**
     * Get campaign performance
     */
    getCampaignPerformance(campaignId: string): Promise<CampaignPerformance>;

    /**
     * Schedule communication
     */
    schedule(
      communication: ScheduledCommunication
    ): Promise<ScheduleResult>;

    /**
     * Get communication templates
     */
    getTemplates(type?: 'email' | 'sms'): Promise<CommunicationTemplate[]>;

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
  };

  // Loyalty Program
  loyalty: {
    /**
     * Get customer loyalty status
     */
    getLoyaltyStatus(customerId: string): Promise<LoyaltyStatus>;

    /**
     * Award points
     */
    awardPoints(
      customerId: string,
      points: number,
      reason: string,
      referenceId?: string
    ): Promise<PointsResult>;

    /**
     * Redeem points
     */
    redeemPoints(
      customerId: string,
      points: number,
      reward: string,
      orderId?: string
    ): Promise<RedemptionResult>;

    /**
     * Get points history
     */
    getPointsHistory(
      customerId: string,
      limit?: number,
      offset?: number
    ): Promise<PointsTransaction[]>;

    /**
     * Get available rewards
     */
    getAvailableRewards(customerId: string): Promise<LoyaltyReward[]>;

    /**
     * Create reward
     */
    createReward(reward: CreateRewardData): Promise<RewardResult>;

    /**
     * Update loyalty tier
     */
    updateTier(
      customerId: string,
      tierId: string
    ): Promise<TierUpdateResult>;

    /**
     * Get loyalty tiers
     */
    getTiers(): Promise<LoyaltyTier[]>;
  };

  // Customer Analytics
  analytics: {
    /**
     * Get customer lifetime value
     */
    getLifetimeValue(customerId: string): Promise<LifetimeValue>;

    /**
     * Get customer health score
     */
    getHealthScore(customerId: string): Promise<HealthScore>;

    /**
     * Get churn prediction
     */
    getChurnPrediction(customerId: string): Promise<ChurnPrediction>;

    /**
     * Get customer cohort analysis
     */
    getCohortAnalysis(period: DateRange): Promise<CohortAnalysis>;

    /**
     * Get retention analysis
     */
    getRetentionAnalysis(period: DateRange): Promise<RetentionAnalysis>;

    /**
     * Get segment performance
     */
    getSegmentPerformance(
      segmentId?: string,
      period?: DateRange
    ): Promise<SegmentPerformance[]>;

    /**
     * Get RFM analysis
     */
    getRFMAnalysis(): Promise<RFMAnalysis>;

    /**
     * Generate insights
     */
    generateInsights(customerId: string): Promise<CustomerInsights>;
  };

  // Support & Tickets
  support: {
    /**
     * Create support ticket
     */
    createTicket(ticket: CreateTicketData): Promise<TicketResult>;

    /**
     * Get ticket by ID
     */
    getTicket(ticketId: string): Promise<SupportTicket | null>;

    /**
     * Update ticket
     */
    updateTicket(
      ticketId: string,
      updates: UpdateTicketData
    ): Promise<TicketResult>;

    /**
     * Close ticket
     */
    closeTicket(
      ticketId: string,
      resolution: string
    ): Promise<CloseTicketResult>;

    /**
     * Add ticket comment
     */
    addComment(
      ticketId: string,
      comment: TicketComment
    ): Promise<CommentResult>;

    /**
     * Get customer tickets
     */
    getCustomerTickets(
      customerId: string,
      filters?: TicketFilters
    ): Promise<SupportTicket[]>;

    /**
     * Escalate ticket
     */
    escalateTicket(
      ticketId: string,
      escalationLevel: EscalationLevel,
      reason: string
    ): Promise<EscalationResult>;

    /**
     * Get ticket metrics
     */
    getTicketMetrics(period: DateRange): Promise<TicketMetrics>;
  };

  // Feedback & Reviews
  feedback: {
    /**
     * Submit feedback
     */
    submit(feedback: CustomerFeedback): Promise<FeedbackResult>;

    /**
     * Get customer feedback
     */
    getCustomerFeedback(
      customerId: string,
      filters?: FeedbackFilters
    ): Promise<Feedback[]>;

    /**
     * Get feedback summary
     */
    getFeedbackSummary(period: DateRange): Promise<FeedbackSummary>;

    /**
     * Respond to feedback
     */
    respond(
      feedbackId: string,
      response: FeedbackResponse
    ): Promise<ResponseResult>;

    /**
     * Get sentiment analysis
     */
    getSentimentAnalysis(period: DateRange): Promise<SentimentAnalysis>;

    /**
     * Request review
     */
    requestReview(
      customerId: string,
      orderIds: string[]
    ): Promise<ReviewRequestResult>;

    /**
     * Get review metrics
     */
    getReviewMetrics(period: DateRange): Promise<ReviewMetrics>;
  };
}

// Supporting Types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  addresses: CustomerAddress[];
  tags: string[];
  segment?: string;
  source: string;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
  lifetimeValue: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  loyaltyPoints: number;
  loyaltyTier?: string;
  preferredCommunication: CommunicationPreference[];
  socialProfiles: SocialProfile[];
  customFields: Record<string, any>;
  notes: string;
  avatar?: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'prospective' | 'churned' | 'blocked';

export interface CustomerAddress {
  id: string;
  type: 'billing' | 'shipping' | 'both';
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
  isDefault: boolean;
}

export interface CommunicationPreference {
  type: 'email' | 'sms' | 'phone' | 'mail';
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  categories: string[];
}

export interface SocialProfile {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  username: string;
  url: string;
  verified: boolean;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  segment?: string;
  tags?: string[];
  source?: string;
  lifetimeValueRange?: {
    min: number;
    max: number;
  };
  lastContactRange?: DateRange;
  createdDateRange?: DateRange;
  loyaltyTier?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerSearchCriteria {
  query: string;
  fields?: ('name' | 'email' | 'phone' | 'tags')[];
  filters?: CustomerFilters;
}

export interface CustomerSearchResult {
  customers: Customer[];
  total: number;
  facets: SearchFacet[];
}

export interface SearchFacet {
  name: string;
  values: {
    value: string;
    count: number;
  }[];
}

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  addresses?: Omit<CustomerAddress, 'id'>[];
  tags?: string[];
  source: string;
  preferredCommunication?: CommunicationPreference[];
  socialProfiles?: SocialProfile[];
  customFields?: Record<string, any>;
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  status?: CustomerStatus;
}

export interface CustomerResult {
  success: boolean;
  customer?: Customer;
  error?: string;
}

export interface MergeResult {
  success: boolean;
  mergedCustomer?: Customer;
  conflictResolutions?: Record<string, any>;
  error?: string;
}

export interface ArchiveResult {
  success: boolean;
  error?: string;
}

export interface CustomerTimeline {
  customerId: string;
  events: TimelineEvent[];
  totalEvents: number;
}

export interface TimelineEvent {
  id: string;
  type: 'order' | 'interaction' | 'support' | 'feedback' | 'booking' | 'communication';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  importance: 'low' | 'medium' | 'high';
}

export interface CustomerPreferences {
  communication: CommunicationPreference[];
  marketing: {
    newsletters: boolean;
    promotions: boolean;
    productUpdates: boolean;
    events: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    targeting: boolean;
  };
  service: {
    preferredStaff?: string[];
    preferredTimes: string[];
    reminderAdvance: number; // minutes
    bookingConfirmation: boolean;
  };
  customPreferences: Record<string, any>;
}

export interface PreferencesResult {
  success: boolean;
  preferences?: CustomerPreferences;
  error?: string;
}

export interface Contact {
  id: string;
  customerId: string;
  type: ContactType;
  subject: string;
  content: string;
  method: 'email' | 'phone' | 'sms' | 'chat' | 'in_person';
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'completed' | 'failed';
  staffId?: string;
  timestamp: Date;
  duration?: number; // minutes
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  tags: string[];
  metadata?: Record<string, any>;
}

export type ContactType = 'sales' | 'support' | 'marketing' | 'service' | 'complaint' | 'inquiry';

export interface ContactData {
  type: ContactType;
  subject: string;
  content: string;
  method: 'email' | 'phone' | 'sms' | 'chat' | 'in_person';
  direction: 'inbound' | 'outbound';
  staffId?: string;
  duration?: number;
  outcome?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateContactData extends Partial<ContactData> {
  status?: 'pending' | 'completed' | 'failed';
}

export interface ContactResult {
  success: boolean;
  contact?: Contact;
  error?: string;
}

export interface RemovalResult {
  success: boolean;
  error?: string;
}

export interface Interaction {
  id: string;
  customerId: string;
  type: 'visit' | 'purchase' | 'return' | 'inquiry' | 'complaint' | 'referral';
  description: string;
  timestamp: Date;
  value?: number;
  staffId?: string;
  orderId?: string;
  satisfaction?: number; // 1-5 scale
  tags: string[];
  metadata?: Record<string, any>;
}

export interface InteractionData {
  type: 'visit' | 'purchase' | 'return' | 'inquiry' | 'complaint' | 'referral';
  description: string;
  value?: number;
  staffId?: string;
  orderId?: string;
  satisfaction?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface InteractionFilters {
  type?: string;
  dateRange?: DateRange;
  staffId?: string;
  minValue?: number;
  maxValue?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface InteractionResult {
  success: boolean;
  interaction?: Interaction;
  error?: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  customerCount: number;
  createdAt: Date;
  updatedAt: Date;
  isAutomatic: boolean;
  tags: string[];
}

export interface SegmentCriteria {
  conditions: SegmentCondition[];
  operator: 'AND' | 'OR';
}

export interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface CreateSegmentData {
  name: string;
  description: string;
  criteria: SegmentCriteria;
  isAutomatic: boolean;
  tags?: string[];
}

export interface UpdateSegmentData extends Partial<CreateSegmentData> {}

export interface SegmentResult {
  success: boolean;
  segment?: CustomerSegment;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface SegmentMembershipResult {
  success: boolean;
  error?: string;
}

export interface AutoSegmentResult {
  success: boolean;
  segmentsUpdated: number;
  customersSegmented: number;
  error?: string;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
}

export interface EmailResult {
  success: boolean;
  messageIds?: string[];
  failedRecipients?: string[];
  error?: string;
}

export interface SMSResult {
  success: boolean;
  messageIds?: string[];
  failedNumbers?: string[];
  error?: string;
}

export interface CreateCampaignData {
  name: string;
  type: 'email' | 'sms' | 'mixed';
  segmentIds: string[];
  templateId: string;
  subject?: string;
  scheduledAt?: Date;
  data?: Record<string, any>;
  trackingEnabled: boolean;
}

export interface CampaignResult {
  success: boolean;
  campaign?: {
    id: string;
    name: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  };
  error?: string;
}

export interface CampaignPerformance {
  campaignId: string;
  sentCount: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
  unsubscribeCount: number;
  bounceCount: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  revenue?: number;
  conversions?: number;
  conversionRate?: number;
}

export interface ScheduledCommunication {
  type: 'email' | 'sms';
  recipientIds: string[];
  templateId: string;
  scheduledAt: Date;
  data?: Record<string, any>;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
  };
}

export interface ScheduleResult {
  success: boolean;
  scheduleId?: string;
  error?: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
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
  type: 'email' | 'sms';
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
  template?: CommunicationTemplate;
  error?: string;
}

export interface LoyaltyStatus {
  customerId: string;
  currentPoints: number;
  lifetimePoints: number;
  currentTier: LoyaltyTier;
  nextTier?: LoyaltyTier;
  pointsToNextTier?: number;
  expiringPoints: {
    points: number;
    expiryDate: Date;
  }[];
}

export interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  minimumPoints: number;
  benefits: string[];
  multiplier: number;
  color: string;
  icon?: string;
}

export interface PointsResult {
  success: boolean;
  newBalance?: number;
  transactionId?: string;
  error?: string;
}

export interface RedemptionResult {
  success: boolean;
  newBalance?: number;
  rewardId?: string;
  transactionId?: string;
  error?: string;
}

export interface PointsTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  reason: string;
  referenceId?: string;
  timestamp: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'product' | 'service' | 'experience';
  value: number;
  isActive: boolean;
  restrictions?: string[];
  expiryDays?: number;
  imageUrl?: string;
}

export interface CreateRewardData {
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'product' | 'service' | 'experience';
  value: number;
  restrictions?: string[];
  expiryDays?: number;
  imageUrl?: string;
}

export interface RewardResult {
  success: boolean;
  reward?: LoyaltyReward;
  error?: string;
}

export interface TierUpdateResult {
  success: boolean;
  newTier?: LoyaltyTier;
  benefits?: string[];
  error?: string;
}

export interface LifetimeValue {
  customerId: string;
  totalValue: number;
  averageOrderValue: number;
  orderFrequency: number;
  predictedValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: {
    recency: number;
    frequency: number;
    monetary: number;
  };
}

export interface HealthScore {
  customerId: string;
  score: number; // 0-100
  factors: {
    name: string;
    value: number;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

export interface ChurnPrediction {
  customerId: string;
  churnProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    name: string;
    contribution: number;
  }[];
  recommendations: string[];
  timeframe: number; // days
}

export interface CohortAnalysis {
  period: DateRange;
  cohorts: {
    cohortDate: string;
    customerCount: number;
    retentionRates: {
      period: number;
      rate: number;
      customers: number;
    }[];
  }[];
}

export interface RetentionAnalysis {
  period: DateRange;
  overallRetentionRate: number;
  retentionByPeriod: {
    period: string;
    rate: number;
    customers: number;
  }[];
  retentionBySegment: {
    segmentId: string;
    segmentName: string;
    rate: number;
  }[];
}

export interface SegmentPerformance {
  segmentId: string;
  segmentName: string;
  customerCount: number;
  averageLifetimeValue: number;
  averageOrderValue: number;
  retentionRate: number;
  churnRate: number;
  revenue: number;
  growthRate: number;
}

export interface RFMAnalysis {
  segments: {
    name: string;
    description: string;
    customerCount: number;
    averageRecency: number;
    averageFrequency: number;
    averageMonetary: number;
    characteristics: string[];
    recommendations: string[];
  }[];
  distribution: {
    recency: { range: string; count: number }[];
    frequency: { range: string; count: number }[];
    monetary: { range: string; count: number }[];
  };
}

export interface CustomerInsights {
  customerId: string;
  insights: {
    type: 'behavioral' | 'preference' | 'value' | 'risk' | 'opportunity';
    title: string;
    description: string;
    confidence: number;
    actionable: boolean;
    recommendations: string[];
  }[];
  generatedAt: Date;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  assignedTo?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolutionTime?: number; // minutes
  satisfaction?: number; // 1-5 scale
  source: 'email' | 'phone' | 'chat' | 'web' | 'social';
  metadata?: Record<string, any>;
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type EscalationLevel = 'supervisor' | 'manager' | 'director';

export interface CreateTicketData {
  customerId: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  category: string;
  source: 'email' | 'phone' | 'chat' | 'web' | 'social';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTicketData extends Partial<CreateTicketData> {
  status?: TicketStatus;
  assignedTo?: string;
}

export interface TicketResult {
  success: boolean;
  ticket?: SupportTicket;
  error?: string;
}

export interface CloseTicketResult {
  success: boolean;
  resolutionTime?: number;
  error?: string;
}

export interface TicketComment {
  content: string;
  isPublic: boolean;
  staffId?: string;
  attachments?: string[];
}

export interface CommentResult {
  success: boolean;
  commentId?: string;
  error?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedTo?: string;
  dateRange?: DateRange;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface EscalationResult {
  success: boolean;
  escalatedTo?: string;
  error?: string;
}

export interface TicketMetrics {
  period: DateRange;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  firstResponseTime: number;
  customerSatisfaction: number;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByCategory: Record<string, number>;
  escalationRate: number;
}

export interface CustomerFeedback {
  customerId: string;
  type: 'review' | 'complaint' | 'suggestion' | 'compliment';
  rating?: number; // 1-5 scale
  title: string;
  content: string;
  category: string;
  orderId?: string;
  serviceId?: string;
  staffId?: string;
  isAnonymous: boolean;
  allowContact: boolean;
  tags?: string[];
}

export interface Feedback {
  id: string;
  customerId: string;
  type: 'review' | 'complaint' | 'suggestion' | 'compliment';
  rating?: number;
  title: string;
  content: string;
  category: string;
  orderId?: string;
  serviceId?: string;
  staffId?: string;
  isAnonymous: boolean;
  allowContact: boolean;
  tags: string[];
  status: 'pending' | 'reviewed' | 'responded' | 'resolved';
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: Date;
  updatedAt: Date;
  response?: FeedbackResponse;
}

export interface FeedbackFilters {
  type?: string;
  rating?: number;
  category?: string;
  status?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  dateRange?: DateRange;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface FeedbackResult {
  success: boolean;
  feedback?: Feedback;
  error?: string;
}

export interface FeedbackSummary {
  period: DateRange;
  totalFeedback: number;
  averageRating: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  feedbackByType: Record<string, number>;
  feedbackByCategory: Record<string, number>;
  topCompliments: string[];
  topComplaints: string[];
  responseRate: number;
}

export interface FeedbackResponse {
  content: string;
  staffId: string;
  isPublic: boolean;
  respondedAt: Date;
}

export interface ResponseResult {
  success: boolean;
  error?: string;
}

export interface SentimentAnalysis {
  period: DateRange;
  overallSentiment: number; // -1 to 1
  trendingTopics: {
    topic: string;
    sentiment: number;
    mentions: number;
    trend: 'improving' | 'declining' | 'stable';
  }[];
  sentimentByCategory: {
    category: string;
    sentiment: number;
    count: number;
  }[];
  urgentIssues: {
    issue: string;
    severity: number;
    affectedCustomers: number;
    firstMentioned: Date;
  }[];
}

export interface ReviewRequestResult {
  success: boolean;
  requestsSent: number;
  error?: string;
}

export interface ReviewMetrics {
  period: DateRange;
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  reviewsByRating: Record<number, number>;
  verifiedReviews: number;
  helpfulReviews: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}