/**
 * E-commerce Platform Team API Contract
 *
 * Team Size: 16 agents
 * Purpose: Full commerce features with Stripe integration
 * Dependencies: Foundation Team (✅ completed), Database Team, Auth Team
 */

export interface EcommerceContract {
  // Product Management
  products: {
    /**
     * Get all products
     */
    getAll(filters?: ProductFilters): Promise<Product[]>;

    /**
     * Get product by ID
     */
    getById(productId: string): Promise<Product | null>;

    /**
     * Search products
     */
    search(criteria: ProductSearchCriteria): Promise<ProductSearchResult>;

    /**
     * Create new product
     */
    create(product: CreateProductData): Promise<ProductResult>;

    /**
     * Update product
     */
    update(
      productId: string,
      updates: UpdateProductData
    ): Promise<ProductResult>;

    /**
     * Delete product
     */
    delete(productId: string): Promise<DeleteResult>;

    /**
     * Get product variants
     */
    getVariants(productId: string): Promise<ProductVariant[]>;

    /**
     * Manage inventory
     */
    updateInventory(
      productId: string,
      variantId: string,
      quantity: number
    ): Promise<InventoryResult>;
  };

  // Category Management
  categories: {
    /**
     * Get all categories
     */
    getAll(): Promise<Category[]>;

    /**
     * Get category tree
     */
    getTree(): Promise<CategoryTree>;

    /**
     * Create category
     */
    create(category: CreateCategoryData): Promise<CategoryResult>;

    /**
     * Update category
     */
    update(
      categoryId: string,
      updates: UpdateCategoryData
    ): Promise<CategoryResult>;

    /**
     * Delete category
     */
    delete(categoryId: string): Promise<DeleteResult>;
  };

  // Shopping Cart
  cart: {
    /**
     * Get cart for user
     */
    getCart(userId: string): Promise<Cart | null>;

    /**
     * Add item to cart
     */
    addItem(userId: string, item: CartItem): Promise<CartResult>;

    /**
     * Update cart item
     */
    updateItem(
      userId: string,
      itemId: string,
      updates: CartItemUpdate
    ): Promise<CartResult>;

    /**
     * Remove item from cart
     */
    removeItem(userId: string, itemId: string): Promise<CartResult>;

    /**
     * Clear cart
     */
    clear(userId: string): Promise<CartResult>;

    /**
     * Apply coupon
     */
    applyCoupon(userId: string, couponCode: string): Promise<CouponResult>;

    /**
     * Remove coupon
     */
    removeCoupon(userId: string): Promise<CartResult>;

    /**
     * Calculate cart totals
     */
    calculateTotals(userId: string): Promise<CartTotals>;
  };

  // Order Management
  orders: {
    /**
     * Create order from cart
     */
    createFromCart(
      userId: string,
      orderData: CreateOrderData
    ): Promise<OrderResult>;

    /**
     * Get order by ID
     */
    getById(orderId: string): Promise<Order | null>;

    /**
     * Get user orders
     */
    getUserOrders(
      userId: string,
      filters?: OrderFilters
    ): Promise<Order[]>;

    /**
     * Update order status
     */
    updateStatus(
      orderId: string,
      status: OrderStatus,
      notes?: string
    ): Promise<OrderResult>;

    /**
     * Cancel order
     */
    cancel(orderId: string, reason: string): Promise<CancellationResult>;

    /**
     * Process return
     */
    processReturn(
      orderId: string,
      returnData: ReturnData
    ): Promise<ReturnResult>;

    /**
     * Track order
     */
    track(orderId: string): Promise<TrackingInfo>;
  };

  // Payment Processing
  payments: {
    /**
     * Create payment intent
     */
    createIntent(
      amount: number,
      currency: string,
      metadata?: Record<string, any>
    ): Promise<PaymentIntent>;

    /**
     * Confirm payment
     */
    confirm(paymentIntentId: string): Promise<PaymentResult>;

    /**
     * Process refund
     */
    refund(
      paymentIntentId: string,
      amount?: number,
      reason?: string
    ): Promise<RefundResult>;

    /**
     * Get payment methods for user
     */
    getPaymentMethods(userId: string): Promise<PaymentMethod[]>;

    /**
     * Save payment method
     */
    savePaymentMethod(
      userId: string,
      paymentMethod: SavePaymentMethodData
    ): Promise<PaymentMethodResult>;

    /**
     * Delete payment method
     */
    deletePaymentMethod(
      userId: string,
      paymentMethodId: string
    ): Promise<DeleteResult>;
  };

  // Inventory Management
  inventory: {
    /**
     * Get inventory status
     */
    getStatus(productId: string, variantId?: string): Promise<InventoryStatus>;

    /**
     * Reserve inventory
     */
    reserve(
      items: InventoryReservation[]
    ): Promise<ReservationResult>;

    /**
     * Release reservation
     */
    releaseReservation(reservationId: string): Promise<ReleaseResult>;

    /**
     * Update stock levels
     */
    updateStock(
      productId: string,
      variantId: string,
      quantity: number,
      operation: 'add' | 'subtract' | 'set'
    ): Promise<StockUpdateResult>;

    /**
     * Get low stock alerts
     */
    getLowStockAlerts(): Promise<LowStockAlert[]>;

    /**
     * Track inventory movements
     */
    getMovements(
      productId: string,
      dateRange?: DateRange
    ): Promise<InventoryMovement[]>;
  };

  // Shipping & Fulfillment
  shipping: {
    /**
     * Calculate shipping rates
     */
    calculateRates(
      destination: Address,
      items: ShippingItem[]
    ): Promise<ShippingRate[]>;

    /**
     * Create shipment
     */
    createShipment(
      orderId: string,
      shippingData: CreateShipmentData
    ): Promise<ShipmentResult>;

    /**
     * Track shipment
     */
    trackShipment(trackingNumber: string): Promise<ShipmentTracking>;

    /**
     * Update shipment status
     */
    updateShipmentStatus(
      shipmentId: string,
      status: ShipmentStatus,
      location?: string
    ): Promise<ShipmentResult>;

    /**
     * Get shipping zones
     */
    getShippingZones(): Promise<ShippingZone[]>;

    /**
     * Manage shipping methods
     */
    getShippingMethods(): Promise<ShippingMethod[]>;
  };

  // Promotions & Discounts
  promotions: {
    /**
     * Get active promotions
     */
    getActive(): Promise<Promotion[]>;

    /**
     * Apply promotion
     */
    apply(
      userId: string,
      promotionCode: string,
      context: PromotionContext
    ): Promise<PromotionResult>;

    /**
     * Validate promotion
     */
    validate(
      promotionCode: string,
      context: PromotionContext
    ): Promise<ValidationResult>;

    /**
     * Create promotion
     */
    create(promotion: CreatePromotionData): Promise<PromotionCreationResult>;

    /**
     * Update promotion
     */
    update(
      promotionId: string,
      updates: UpdatePromotionData
    ): Promise<PromotionCreationResult>;

    /**
     * Deactivate promotion
     */
    deactivate(promotionId: string): Promise<DeactivationResult>;
  };

  // Analytics & Reporting
  analytics: {
    /**
     * Get sales statistics
     */
    getSalesStats(period: DateRange): Promise<SalesStats>;

    /**
     * Get product performance
     */
    getProductPerformance(
      productId?: string,
      period?: DateRange
    ): Promise<ProductPerformance[]>;

    /**
     * Get customer analytics
     */
    getCustomerAnalytics(period: DateRange): Promise<CustomerAnalytics>;

    /**
     * Get revenue trends
     */
    getRevenueTrends(period: DateRange): Promise<RevenueTrends>;

    /**
     * Get conversion funnel
     */
    getConversionFunnel(period: DateRange): Promise<ConversionFunnel>;

    /**
     * Get abandoned cart analysis
     */
    getAbandonedCartAnalysis(period: DateRange): Promise<AbandonedCartAnalysis>;
  };
}

// Supporting Types
export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  slug: string;
  categoryId: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  trackQuantity: boolean;
  continueSellingWhenOutOfStock: boolean;
  requiresShipping: boolean;
  taxable: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  variants: ProductVariant[];
  images: ProductImage[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  position: number;
  inventoryQuantity: number;
  inventoryPolicy: 'deny' | 'continue';
  fulfillmentService: string;
  requiresShipping: boolean;
  taxable: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  barcode?: string;
  image?: ProductImage;
  options: VariantOption[];
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductImage {
  id: string;
  src: string;
  alt?: string;
  position: number;
  variantIds: string[];
}

export interface VariantOption {
  name: string;
  value: string;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductFilters {
  categoryId?: string;
  status?: ProductStatus;
  brand?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductSearchCriteria {
  query: string;
  filters?: ProductFilters;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'created_at';
}

export interface ProductSearchResult {
  products: Product[];
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

export interface CreateProductData {
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;
  categoryId: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  trackQuantity: boolean;
  continueSellingWhenOutOfStock: boolean;
  requiresShipping: boolean;
  taxable: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  variants?: Omit<ProductVariant, 'id' | 'productId'>[];
  images?: Omit<ProductImage, 'id'>[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: ProductStatus;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductResult {
  success: boolean;
  product?: Product;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface InventoryResult {
  success: boolean;
  previousQuantity?: number;
  newQuantity?: number;
  error?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  position: number;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: 'active' | 'inactive';
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTree {
  categories: CategoryTreeNode[];
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string;
  position: number;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: 'active' | 'inactive';
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CategoryResult {
  success: boolean;
  category?: Category;
  error?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totals: CartTotals;
  coupon?: AppliedCoupon;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  compareAtPrice?: number;
  title: string;
  variantTitle?: string;
  sku: string;
  image?: ProductImage;
  properties?: Record<string, any>;
}

export interface CartItemUpdate {
  quantity?: number;
  properties?: Record<string, any>;
}

export interface CartResult {
  success: boolean;
  cart?: Cart;
  error?: string;
}

export interface CouponResult {
  success: boolean;
  cart?: Cart;
  discount?: number;
  error?: string;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  itemCount: number;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  discountAmount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  email: string;
  status: OrderStatus;
  financialStatus: FinancialStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: ShippingMethod;
  paymentMethod: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  notes?: string;
  tags: string[];
  source: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  cancelledAt?: Date;
  metadata?: Record<string, any>;
}

export type OrderStatus =
  | 'pending'
  | 'open'
  | 'closed'
  | 'cancelled';

export type FinancialStatus =
  | 'pending'
  | 'authorized'
  | 'partially_paid'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'
  | 'voided';

export type FulfillmentStatus =
  | 'unfulfilled'
  | 'partial'
  | 'fulfilled'
  | 'restocked';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  variantTitle?: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  image?: ProductImage;
  fulfillableQuantity: number;
  fulfillmentService: string;
  taxable: boolean;
  taxLines: TaxLine[];
  properties?: Record<string, any>;
}

export interface TaxLine {
  title: string;
  rate: number;
  price: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface CreateOrderData {
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethodId: string;
  notes?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface OrderFilters {
  status?: OrderStatus;
  financialStatus?: FinancialStatus;
  fulfillmentStatus?: FulfillmentStatus;
  dateRange?: DateRange;
  limit?: number;
  offset?: number;
}

export interface OrderResult {
  success: boolean;
  order?: Order;
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  refundAmount?: number;
  error?: string;
}

export interface ReturnData {
  items: {
    orderItemId: string;
    quantity: number;
    reason: string;
  }[];
  refundShipping: boolean;
  restockItems: boolean;
  notes?: string;
}

export interface ReturnResult {
  success: boolean;
  returnId?: string;
  refundAmount?: number;
  error?: string;
}

export interface TrackingInfo {
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  status: OrderStatus;
  estimatedDelivery?: Date;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  clientSecret: string;
  metadata?: Record<string, any>;
}

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refund?: {
    id: string;
    amount: number;
    status: string;
  };
  error?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface SavePaymentMethodData {
  paymentMethodId: string;
  setAsDefault: boolean;
}

export interface PaymentMethodResult {
  success: boolean;
  paymentMethod?: PaymentMethod;
  error?: string;
}

export interface InventoryStatus {
  productId: string;
  variantId?: string;
  available: number;
  committed: number;
  onHand: number;
  inTransit: number;
}

export interface InventoryReservation {
  productId: string;
  variantId: string;
  quantity: number;
  expiresAt: Date;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  expiresAt?: Date;
  error?: string;
}

export interface ReleaseResult {
  success: boolean;
  error?: string;
}

export interface StockUpdateResult {
  success: boolean;
  previousQuantity?: number;
  newQuantity?: number;
  error?: string;
}

export interface LowStockAlert {
  productId: string;
  variantId: string;
  productName: string;
  variantName?: string;
  currentStock: number;
  threshold: number;
  sku: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId: string;
  type: 'sale' | 'adjustment' | 'return' | 'restock';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  orderId?: string;
  userId: string;
  timestamp: Date;
}

export interface ShippingItem {
  productId: string;
  variantId: string;
  quantity: number;
  weight: number;
  dimensions: ProductDimensions;
  value: number;
}

export interface ShippingRate {
  id: string;
  name: string;
  description?: string;
  price: number;
  deliveryTime: string;
  carrier: string;
  serviceCode: string;
}

export interface CreateShipmentData {
  carrierId: string;
  serviceCode: string;
  items: {
    orderItemId: string;
    quantity: number;
  }[];
  trackingNumber?: string;
  notifyCustomer: boolean;
}

export interface ShipmentResult {
  success: boolean;
  shipment?: {
    id: string;
    trackingNumber: string;
    carrier: string;
    estimatedDelivery?: Date;
  };
  error?: string;
}

export interface ShipmentTracking {
  trackingNumber: string;
  carrier: string;
  status: ShipmentStatus;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  events: ShipmentEvent[];
}

export type ShipmentStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'returned';

export interface ShipmentEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  provinces?: string[];
  shippingMethods: ShippingMethod[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
  freeShippingThreshold?: number;
  deliveryTime: string;
  carrier?: string;
  enabled: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'shipping' | 'buy_x_get_y';
  value: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  usageLimitPerCustomer?: number;
  startsAt: Date;
  endsAt?: Date;
  active: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  excludedCategories?: string[];
}

export interface PromotionContext {
  userId?: string;
  cartTotal: number;
  cartItems: CartItem[];
}

export interface PromotionResult {
  success: boolean;
  discountAmount?: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  discountAmount?: number;
  error?: string;
}

export interface CreatePromotionData {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'shipping' | 'buy_x_get_y';
  value: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  startsAt: Date;
  endsAt?: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  excludedCategories?: string[];
}

export interface UpdatePromotionData extends Partial<CreatePromotionData> {}

export interface PromotionCreationResult {
  success: boolean;
  promotion?: Promotion;
  error?: string;
}

export interface DeactivationResult {
  success: boolean;
  error?: string;
}

export interface SalesStats {
  period: DateRange;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  returningCustomerRate: number;
  totalCustomers: number;
  newCustomers: number;
  trends: {
    revenue: TrendPoint[];
    orders: TrendPoint[];
    customers: TrendPoint[];
  };
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  revenue: number;
  unitsSold: number;
  averageOrderValue: number;
  conversionRate: number;
  viewCount: number;
  returnRate: number;
  profitMargin: number;
}

export interface CustomerAnalytics {
  period: DateRange;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  averageOrderFrequency: number;
  churnRate: number;
  segments: {
    name: string;
    count: number;
    revenue: number;
    averageOrderValue: number;
  }[];
}

export interface RevenueTrends {
  period: DateRange;
  data: {
    date: string;
    revenue: number;
    orders: number;
    averageOrderValue: number;
  }[];
  growthRate: number;
  seasonality: {
    month: string;
    indexValue: number;
  }[];
}

export interface ConversionFunnel {
  period: DateRange;
  stages: {
    name: string;
    visitors: number;
    conversionRate: number;
  }[];
  dropOffPoints: {
    stage: string;
    dropOffRate: number;
    suggestions: string[];
  }[];
}

export interface AbandonedCartAnalysis {
  period: DateRange;
  totalAbandoned: number;
  recoveredCarts: number;
  recoveryRate: number;
  averageCartValue: number;
  lostRevenue: number;
  topAbandonReasons: {
    reason: string;
    percentage: number;
  }[];
  recoveryOpportunities: {
    timeframe: string;
    potentialRevenue: number;
    cartCount: number;
  }[];
}

export interface DateRange {
  start: Date;
  end: Date;
}