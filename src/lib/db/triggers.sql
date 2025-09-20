-- Pink Blueberry Salon - PostgreSQL Functions and Triggers
-- Advanced database functions for multi-tenant SaaS platform

-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==========================================
-- AUDIT FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for comprehensive audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_row RECORD;
    excluded_cols TEXT[] = ARRAY['created_at','updated_at'];
    new_values JSONB;
    old_values JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        new_values = to_jsonb(NEW);
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            changes,
            created_at
        ) VALUES (
            current_setting('app.current_user', true)::UUID,
            'CREATE',
            TG_TABLE_NAME,
            NEW.id,
            jsonb_build_object('new', new_values),
            CURRENT_TIMESTAMP
        );
    ELSIF TG_OP = 'UPDATE' THEN
        old_values = to_jsonb(OLD);
        new_values = to_jsonb(NEW);

        -- Only log if there are actual changes
        IF old_values != new_values THEN
            INSERT INTO audit_logs (
                user_id,
                action,
                entity_type,
                entity_id,
                changes,
                created_at
            ) VALUES (
                current_setting('app.current_user', true)::UUID,
                'UPDATE',
                TG_TABLE_NAME,
                NEW.id,
                jsonb_build_object('old', old_values, 'new', new_values),
                CURRENT_TIMESTAMP
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        old_values = to_jsonb(OLD);
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            changes,
            created_at
        ) VALUES (
            current_setting('app.current_user', true)::UUID,
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            jsonb_build_object('old', old_values),
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- MULTI-TENANCY FUNCTIONS
-- ==========================================

-- Function to enforce tenant isolation
CREATE OR REPLACE FUNCTION enforce_tenant_isolation()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('app.current_tenant', true) IS NULL THEN
        RAISE EXCEPTION 'Tenant context is required';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.tenant_id = current_setting('app.current_tenant')::UUID;
    ELSIF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        IF OLD.tenant_id != current_setting('app.current_tenant')::UUID THEN
            RAISE EXCEPTION 'Cross-tenant operation not allowed';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- BUSINESS LOGIC FUNCTIONS
-- ==========================================

-- Function to calculate appointment total price
CREATE OR REPLACE FUNCTION calculate_appointment_total()
RETURNS TRIGGER AS $$
DECLARE
    service_total DECIMAL(10,2);
    addon_total DECIMAL(10,2);
    tax_rate DECIMAL(5,4) DEFAULT 0.08;
BEGIN
    -- Calculate service total
    SELECT COALESCE(SUM(price - discount_amount), 0)
    INTO service_total
    FROM appointment_services
    WHERE appointment_id = NEW.id;

    -- Calculate addon total
    SELECT COALESCE(SUM(price), 0)
    INTO addon_total
    FROM appointment_add_ons
    WHERE appointment_id = NEW.id;

    -- Update appointment totals
    NEW.total_price = service_total + addon_total - COALESCE(NEW.discount_amount, 0);
    NEW.tax_amount = NEW.total_price * tax_rate;
    NEW.final_price = NEW.total_price + NEW.tax_amount;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer lifetime value
CREATE OR REPLACE FUNCTION update_customer_lifetime_value()
RETURNS TRIGGER AS $$
DECLARE
    new_lifetime_value DECIMAL(10,2);
    new_total_visits INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'COMPLETED' THEN
            -- Calculate new lifetime value and visit count
            SELECT
                COALESCE(SUM(final_price), 0),
                COALESCE(COUNT(*), 0)
            INTO new_lifetime_value, new_total_visits
            FROM appointments
            WHERE customer_id = NEW.customer_id
                AND status = 'COMPLETED'
                AND deleted_at IS NULL;

            -- Update customer record
            UPDATE customers
            SET
                lifetime_value = new_lifetime_value,
                total_visits = new_total_visits,
                last_visit = NEW.completed_at
            WHERE id = NEW.customer_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to manage inventory on order
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Reserve inventory for new order
        FOR item IN SELECT * FROM order_items WHERE order_id = NEW.id
        LOOP
            UPDATE inventory
            SET
                quantity_reserved = quantity_reserved + item.quantity,
                quantity_available = quantity_on_hand - (quantity_reserved + item.quantity)
            WHERE product_id = item.product_id
                AND branch_id = (
                    SELECT branch_id FROM orders o
                    JOIN customers c ON o.customer_id = c.id
                    WHERE o.id = NEW.id
                    LIMIT 1
                );

            -- Log inventory movement
            INSERT INTO inventory_movements (
                inventory_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                created_at
            ) SELECT
                i.id,
                'RESERVED',
                item.quantity,
                'ORDER',
                NEW.id,
                CURRENT_TIMESTAMP
            FROM inventory i
            WHERE i.product_id = item.product_id;
        END LOOP;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'COMPLETED' AND NEW.status = 'COMPLETED' THEN
            -- Finalize inventory for completed order
            FOR item IN SELECT * FROM order_items WHERE order_id = NEW.id
            LOOP
                UPDATE inventory
                SET
                    quantity_on_hand = quantity_on_hand - item.quantity,
                    quantity_reserved = quantity_reserved - item.quantity,
                    quantity_available = quantity_on_hand - item.quantity - quantity_reserved
                WHERE product_id = item.product_id
                    AND branch_id = (
                        SELECT branch_id FROM orders o
                        JOIN customers c ON o.customer_id = c.id
                        WHERE o.id = NEW.id
                        LIMIT 1
                    );
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random code
        new_code := 'APT-' ||
                   UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FOR 3)) ||
                   '-' ||
                   LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

        -- Check if code exists
        EXECUTE 'SELECT EXISTS(SELECT 1 FROM appointments WHERE confirmation_code = $1)'
        INTO code_exists
        USING new_code;

        -- Exit loop if unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    NEW.confirmation_code = new_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate appointment time slots
CREATE OR REPLACE FUNCTION validate_appointment_time()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for time slot conflicts
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointments
    WHERE staff_id = NEW.staff_id
        AND appointment_date = NEW.appointment_date
        AND deleted_at IS NULL
        AND id != COALESCE(NEW.id, uuid_nil())
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND (
            (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
        );

    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Time slot conflict detected for staff member';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERFORMANCE FUNCTIONS
-- ==========================================

-- Function to update materialized view for analytics
CREATE OR REPLACE FUNCTION refresh_analytics_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS daily_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS monthly_revenue;
    REFRESH MATERIALIZED VIEW CONCURRENTLY IF EXISTS staff_performance;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old records
CREATE OR REPLACE FUNCTION archive_old_records()
RETURNS void AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Archive appointments older than 2 years
    WITH archived AS (
        INSERT INTO appointments_archive
        SELECT * FROM appointments
        WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
            AND status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW')
        RETURNING id
    )
    SELECT COUNT(*) INTO archived_count FROM archived;

    -- Delete archived records from main table
    DELETE FROM appointments
    WHERE created_at < CURRENT_DATE - INTERVAL '2 years'
        AND status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW');

    RAISE NOTICE 'Archived % appointments', archived_count;

    -- Archive audit logs older than 1 year
    WITH archived AS (
        INSERT INTO audit_logs_archive
        SELECT * FROM audit_logs
        WHERE created_at < CURRENT_DATE - INTERVAL '1 year'
        RETURNING id
    )
    SELECT COUNT(*) INTO archived_count FROM archived;

    DELETE FROM audit_logs
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

    RAISE NOTICE 'Archived % audit logs', archived_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- NOTIFICATION FUNCTIONS
-- ==========================================

-- Function to create appointment reminders
CREATE OR REPLACE FUNCTION create_appointment_reminder()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CONFIRMED' AND OLD.status != 'CONFIRMED' THEN
        -- Create 24-hour reminder
        INSERT INTO notifications (
            recipient_id,
            customer_id,
            type,
            category,
            subject,
            message,
            scheduled_for,
            data
        ) SELECT
            c.user_id,
            NEW.customer_id,
            'EMAIL',
            'APPOINTMENT',
            'Appointment Reminder',
            'Your appointment is tomorrow at ' || TO_CHAR(NEW.start_time, 'HH:MI AM'),
            NEW.appointment_date - INTERVAL '24 hours',
            jsonb_build_object('appointment_id', NEW.id)
        FROM customers c
        WHERE c.id = NEW.customer_id
            AND c.user_id IS NOT NULL;

        -- Create 1-hour reminder via SMS
        INSERT INTO notifications (
            recipient_id,
            customer_id,
            type,
            category,
            subject,
            message,
            scheduled_for,
            data
        ) SELECT
            c.user_id,
            NEW.customer_id,
            'SMS',
            'APPOINTMENT',
            'Appointment in 1 hour',
            'Your appointment is in 1 hour',
            NEW.start_time - INTERVAL '1 hour',
            jsonb_build_object('appointment_id', NEW.id)
        FROM customers c
        WHERE c.id = NEW.customer_id
            AND c.user_id IS NOT NULL
            AND c.phone IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- APPLY TRIGGERS
-- ==========================================

-- Updated_at triggers for all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
            AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()',
            t, t);
    END LOOP;
END $$;

-- Audit triggers for critical tables
CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_staff AFTER INSERT OR UPDATE OR DELETE ON staff
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Business logic triggers
CREATE TRIGGER calculate_appointment_price
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION calculate_appointment_total();

CREATE TRIGGER update_customer_value
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_customer_lifetime_value();

CREATE TRIGGER manage_inventory
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order();

CREATE TRIGGER generate_appointment_code
    BEFORE INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION generate_confirmation_code();

CREATE TRIGGER validate_appointment
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION validate_appointment_time();

CREATE TRIGGER create_reminders
    AFTER UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION create_appointment_reminder();

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Multi-tenant composite indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gin_customers_search
    ON customers USING gin(
        to_tsvector('english',
            coalesce(first_name, '') || ' ' ||
            coalesce(last_name, '') || ' ' ||
            coalesce(email, '')
        )
    );

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gin_services_search
    ON services USING gin(
        to_tsvector('english',
            coalesce(name, '') || ' ' ||
            coalesce(description, '')
        )
    );

-- BRIN indexes for time-series data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brin_appointments_date
    ON appointments USING brin(appointment_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brin_audit_logs_created
    ON audit_logs USING brin(created_at);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_upcoming
    ON appointments(appointment_date, start_time)
    WHERE status IN ('PENDING', 'CONFIRMED')
        AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_active
    ON staff(branch_id, status)
    WHERE status = 'ACTIVE'
        AND deleted_at IS NULL;