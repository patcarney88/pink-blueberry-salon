# Database Schema Documentation

## PostgreSQL Schema for Pink Blueberry Salon

### Overview
This document provides detailed database schema documentation for the Pink Blueberry Salon SaaS platform, using PostgreSQL with Prisma ORM.

## Core Schema Principles

### Multi-Tenancy Strategy
- **Tenant Isolation**: Row-level security with tenant_id
- **Performance**: Indexed tenant columns for fast filtering
- **Scalability**: Ready for horizontal sharding by tenant

### Data Integrity
- **Foreign Keys**: Enforced relationships
- **Constraints**: Check constraints for business rules
- **Triggers**: Automatic timestamp updates
- **Soft Deletes**: Audit trail preservation

### Performance Optimization
- **Indexes**: Strategic indexing on query patterns
- **Partitioning**: Time-based partitioning for bookings
- **Materialized Views**: Pre-computed analytics

## Entity Details

### 1. Tenant Management

```sql
-- Tenants table (Multi-tenant SaaS)
CREATE TABLE tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'BASIC' CHECK (plan IN ('BASIC', 'PROFESSIONAL', 'ENTERPRISE')),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
    settings JSONB DEFAULT '{}',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan ON tenants(plan);
```

### 2. Salon & Branch Structure

```sql
-- Salons (Main business entity)
CREATE TABLE salons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_salons_tenant ON salons(tenant_id);

-- Branches (Physical locations)
CREATE TABLE branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'USA',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    coordinates POINT,
    operating_hours JSONB NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_salon ON branches(salon_id);
CREATE INDEX idx_branches_active ON branches(is_active);
CREATE INDEX idx_branches_location ON branches USING GIST(coordinates);
```

### 3. Service Catalog

```sql
-- Services offered
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    requires_deposit BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10, 2),
    max_advance_booking_days INTEGER DEFAULT 90,
    min_advance_booking_hours INTEGER DEFAULT 24,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_deposit CHECK (
        (requires_deposit = false AND deposit_amount IS NULL) OR
        (requires_deposit = true AND deposit_amount > 0)
    )
);

CREATE INDEX idx_services_salon ON services(salon_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_category ON services(category);
```

### 4. Staff Management

```sql
-- Staff members
CREATE TABLE staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STYLIST', 'RECEPTIONIST', 'ASSISTANT')),
    specialties TEXT[],
    commission_rate DECIMAL(5, 2) DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    is_active BOOLEAN DEFAULT true,
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, email)
);

CREATE INDEX idx_staff_branch ON staff(branch_id);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_active ON staff(is_active);
CREATE INDEX idx_staff_role ON staff(role);

-- Staff schedules
CREATE TABLE schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, date),
    CONSTRAINT check_schedule_times CHECK (
        end_time > start_time AND
        (break_start IS NULL OR break_end IS NULL OR
         (break_end > break_start AND break_start > start_time AND break_end < end_time))
    )
);

CREATE INDEX idx_schedules_staff ON schedules(staff_id);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_available ON schedules(is_available);

-- Staff services (which services each staff member can perform)
CREATE TABLE staff_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    duration_override_minutes INTEGER,
    price_override DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, service_id)
);

CREATE INDEX idx_staff_services_staff ON staff_services(staff_id);
CREATE INDEX idx_staff_services_service ON staff_services(service_id);
```

### 5. Customer Management

```sql
-- Customers
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    notes TEXT,
    tags TEXT[],
    is_vip BOOLEAN DEFAULT false,
    source VARCHAR(50) DEFAULT 'WALK_IN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_vip ON customers(is_vip);
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
```

### 6. Booking System

```sql
-- Bookings (main booking table)
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    )),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    deposit_paid DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    source VARCHAR(50) DEFAULT 'WEB' CHECK (source IN (
        'WEB', 'MOBILE', 'PHONE', 'WALK_IN', 'ADMIN'
    )),
    metadata JSONB DEFAULT '{}',
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for booking queries
CREATE INDEX idx_bookings_branch ON bookings(branch_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);
CREATE INDEX idx_bookings_branch_date ON bookings(branch_id, scheduled_at);

-- Partitioning for scale
CREATE TABLE bookings_2024 PARTITION OF bookings
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Booking services (services included in each booking)
CREATE TABLE booking_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    staff_id UUID REFERENCES staff(id),
    start_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_services_booking ON booking_services(booking_id);
CREATE INDEX idx_booking_services_staff ON booking_services(staff_id);
CREATE INDEX idx_booking_services_staff_time ON booking_services(staff_id, start_time);
```

### 7. Payment Processing

```sql
-- Payments
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    method VARCHAR(50) NOT NULL CHECK (method IN (
        'CARD', 'CASH', 'BANK_TRANSFER', 'WALLET', 'GIFT_CARD'
    )),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'
    )),
    stripe_payment_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    refund_amount DECIMAL(10, 2),
    refunded_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- Payment items (for itemized receipts)
CREATE TABLE payment_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_items_payment ON payment_items(payment_id);
```

### 8. Loyalty Program

```sql
-- Loyalty accounts
CREATE TABLE loyalty_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    tier VARCHAR(50) DEFAULT 'BRONZE' CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
    total_earned INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    tier_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_tier ON loyalty_accounts(tier);
CREATE INDEX idx_loyalty_customer ON loyalty_accounts(customer_id);

-- Point transactions
CREATE TABLE point_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loyalty_account_id UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED')),
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description VARCHAR(500),
    reference_type VARCHAR(50),
    reference_id UUID,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_account ON point_transactions(loyalty_account_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_point_transactions_expires ON point_transactions(expires_at);
```

### 9. Inventory Management

```sql
-- Products
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    retail_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);

-- Inventory
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    max_quantity INTEGER,
    reorder_point INTEGER,
    location VARCHAR(255),
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, product_id)
);

CREATE INDEX idx_inventory_branch ON inventory(branch_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= min_quantity;

-- Stock movements
CREATE TABLE stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'PURCHASE', 'SALE', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGE'
    )),
    quantity INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2),
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_inventory ON stock_movements(inventory_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
```

### 10. Reviews & Ratings

```sql
-- Reviews
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    response TEXT,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_featured ON reviews(is_featured);
```

### 11. Analytics & Reporting

```sql
-- Materialized view for daily metrics
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT
    b.branch_id,
    DATE(b.scheduled_at) as date,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'COMPLETED' THEN b.id END) as completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'CANCELLED' THEN b.id END) as cancelled_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'NO_SHOW' THEN b.id END) as no_show_bookings,
    COUNT(DISTINCT b.customer_id) as unique_customers,
    SUM(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount ELSE 0 END) as revenue,
    AVG(CASE WHEN b.status = 'COMPLETED' THEN b.total_amount ELSE NULL END) as avg_booking_value,
    COUNT(DISTINCT bs.staff_id) as active_staff,
    AVG(r.rating) as avg_rating
FROM bookings b
LEFT JOIN booking_services bs ON b.id = bs.booking_id
LEFT JOIN reviews r ON b.id = r.booking_id
GROUP BY b.branch_id, DATE(b.scheduled_at);

CREATE INDEX idx_daily_metrics_branch_date ON daily_metrics(branch_id, date);

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_daily_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh via cron or trigger
```

## Database Functions & Triggers

### Automatic Timestamp Updates

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_salons_updated_at BEFORE UPDATE ON salons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ... (apply to all tables)
```

### Booking Slot Availability Check

```sql
-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
    p_staff_id UUID,
    p_start_time TIMESTAMPTZ,
    p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_end_time TIMESTAMPTZ;
    v_conflict_count INTEGER;
BEGIN
    v_end_time := p_start_time + (p_duration_minutes || ' minutes')::INTERVAL;

    SELECT COUNT(*)
    INTO v_conflict_count
    FROM booking_services bs
    JOIN bookings b ON bs.booking_id = b.id
    WHERE bs.staff_id = p_staff_id
    AND b.status NOT IN ('CANCELLED', 'NO_SHOW')
    AND (
        (bs.start_time, bs.start_time + (bs.duration_minutes || ' minutes')::INTERVAL)
        OVERLAPS
        (p_start_time, v_end_time)
    );

    RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
```

### Loyalty Points Calculation

```sql
-- Trigger to award loyalty points on booking completion
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    v_points INTEGER;
    v_loyalty_account_id UUID;
BEGIN
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        -- Calculate points (1 point per dollar spent)
        v_points := FLOOR(NEW.total_amount);

        -- Get or create loyalty account
        SELECT id INTO v_loyalty_account_id
        FROM loyalty_accounts
        WHERE customer_id = NEW.customer_id;

        IF v_loyalty_account_id IS NULL THEN
            INSERT INTO loyalty_accounts (customer_id)
            VALUES (NEW.customer_id)
            RETURNING id INTO v_loyalty_account_id;
        END IF;

        -- Update points
        UPDATE loyalty_accounts
        SET points = points + v_points,
            total_earned = total_earned + v_points
        WHERE id = v_loyalty_account_id;

        -- Record transaction
        INSERT INTO point_transactions (
            loyalty_account_id,
            type,
            points,
            balance_after,
            description,
            reference_type,
            reference_id
        )
        SELECT
            v_loyalty_account_id,
            'EARNED',
            v_points,
            la.points,
            'Points earned from booking',
            'BOOKING',
            NEW.id
        FROM loyalty_accounts la
        WHERE la.id = v_loyalty_account_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_loyalty_points
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION award_loyalty_points();
```

## Performance Optimization

### Query Optimization Views

```sql
-- Staff availability view
CREATE VIEW staff_availability AS
WITH staff_schedules AS (
    SELECT
        s.id as staff_id,
        s.branch_id,
        sch.date,
        sch.start_time,
        sch.end_time,
        sch.break_start,
        sch.break_end
    FROM staff s
    JOIN schedules sch ON s.id = sch.staff_id
    WHERE s.is_active = true
    AND sch.is_available = true
    AND sch.date >= CURRENT_DATE
),
staff_bookings AS (
    SELECT
        bs.staff_id,
        bs.start_time,
        bs.start_time + (bs.duration_minutes || ' minutes')::INTERVAL as end_time
    FROM booking_services bs
    JOIN bookings b ON bs.booking_id = b.id
    WHERE b.status NOT IN ('CANCELLED', 'NO_SHOW')
    AND b.scheduled_at >= CURRENT_DATE
)
SELECT
    ss.staff_id,
    ss.branch_id,
    ss.date,
    ss.start_time,
    ss.end_time,
    array_agg(
        DISTINCT jsonb_build_object(
            'start', sb.start_time,
            'end', sb.end_time
        ) ORDER BY sb.start_time
    ) FILTER (WHERE sb.staff_id IS NOT NULL) as booked_slots
FROM staff_schedules ss
LEFT JOIN staff_bookings sb ON ss.staff_id = sb.staff_id
    AND DATE(sb.start_time) = ss.date
GROUP BY ss.staff_id, ss.branch_id, ss.date, ss.start_time, ss.end_time;

-- Service performance view
CREATE VIEW service_performance AS
SELECT
    s.id as service_id,
    s.name as service_name,
    s.category,
    s.salon_id,
    COUNT(DISTINCT bs.id) as total_bookings,
    COUNT(DISTINCT bs.id) FILTER (WHERE b.status = 'COMPLETED') as completed_bookings,
    AVG(bs.price - bs.discount) as avg_revenue,
    SUM(bs.price - bs.discount) FILTER (WHERE b.status = 'COMPLETED') as total_revenue,
    AVG(r.rating) as avg_rating,
    COUNT(DISTINCT r.id) as review_count
FROM services s
LEFT JOIN booking_services bs ON s.id = bs.service_id
LEFT JOIN bookings b ON bs.booking_id = b.id
LEFT JOIN reviews r ON b.id = r.booking_id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.category, s.salon_id;
```

## Migration Strategy

### Initial Setup

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location-based features
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For exclusion constraints

-- Set default timezone
SET timezone = 'UTC';

-- Create roles
CREATE ROLE salon_admin;
CREATE ROLE salon_staff;
CREATE ROLE salon_customer;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO salon_admin;
GRANT SELECT, INSERT, UPDATE ON bookings, booking_services, customers TO salon_staff;
GRANT SELECT, INSERT, UPDATE ON bookings, customers TO salon_customer;
```

### Data Migration Scripts

```sql
-- Sample data migration from legacy system
INSERT INTO tenants (name, slug, plan)
SELECT DISTINCT
    company_name,
    LOWER(REGEXP_REPLACE(company_name, '[^a-zA-Z0-9]', '-', 'g')),
    CASE
        WHEN location_count > 5 THEN 'ENTERPRISE'
        WHEN location_count > 1 THEN 'PROFESSIONAL'
        ELSE 'BASIC'
    END
FROM legacy_companies;

-- Migrate salons with tenant association
INSERT INTO salons (tenant_id, name, description, settings)
SELECT
    t.id,
    lc.company_name,
    lc.description,
    jsonb_build_object(
        'legacy_id', lc.id,
        'imported_at', NOW()
    )
FROM legacy_companies lc
JOIN tenants t ON t.slug = LOWER(REGEXP_REPLACE(lc.company_name, '[^a-zA-Z0-9]', '-', 'g'));
```

## Backup & Recovery

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DB_NAME="pink_blueberry"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Full backup
pg_dump -h localhost -U postgres -d $DB_NAME -Fc -f "$BACKUP_DIR/full_${TIMESTAMP}.dump"

# Incremental backup using WAL archiving
pg_basebackup -h localhost -U replicator -D "$BACKUP_DIR/base_${TIMESTAMP}" -Fp -Xs -P

# Backup to S3
aws s3 cp "$BACKUP_DIR/full_${TIMESTAMP}.dump" "s3://pink-blueberry-backups/postgres/"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
```

### Point-in-Time Recovery

```sql
-- WAL archiving configuration in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /archives/%f && cp %p /archives/%f'
archive_timeout = 300

-- Recovery configuration
restore_command = 'cp /archives/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
recovery_target_action = 'promote'
```

## Monitoring Queries

### Health Check Queries

```sql
-- Active connections
SELECT
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start DESC;

-- Table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC
LIMIT 20;

-- Slow queries
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time,
    total_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan
LIMIT 20;
```

## Security Configurations

### Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant isolation
CREATE POLICY tenant_isolation ON bookings
    FOR ALL
    USING (
        branch_id IN (
            SELECT b.id FROM branches b
            JOIN salons s ON b.salon_id = s.id
            WHERE s.tenant_id = current_setting('app.tenant_id')::UUID
        )
    );

-- Customer data access policy
CREATE POLICY customer_data_access ON customers
    FOR SELECT
    USING (
        user_id = current_setting('app.user_id')::UUID
        OR
        id IN (
            SELECT customer_id FROM bookings b
            JOIN branches br ON b.branch_id = br.id
            JOIN salons s ON br.salon_id = s.id
            JOIN staff st ON st.branch_id = br.id
            WHERE st.user_id = current_setting('app.user_id')::UUID
        )
    );
```

### Encryption at Rest

```sql
-- Transparent Data Encryption (TDE) configuration
-- Enable in postgresql.conf
CREATE TABLESPACE encrypted_tablespace
    LOCATION '/encrypted/data'
    WITH (encryption_key_id = 'key-id');

-- Move sensitive tables to encrypted tablespace
ALTER TABLE customers SET TABLESPACE encrypted_tablespace;
ALTER TABLE payments SET TABLESPACE encrypted_tablespace;
```

## Conclusion

This database schema provides a robust, scalable foundation for the Pink Blueberry Salon SaaS platform with:

- **Multi-tenancy**: Row-level isolation and tenant-based sharding ready
- **Performance**: Strategic indexing and materialized views
- **Scalability**: Partitioning and read replica support
- **Security**: RLS policies and encryption capabilities
- **Auditability**: Comprehensive timestamp tracking
- **Analytics**: Pre-computed metrics and reporting views

The schema is optimized for Vercel deployment with Prisma ORM, providing excellent performance for the most common salon management operations while maintaining data integrity and security.