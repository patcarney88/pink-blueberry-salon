# Pink Blueberry Salon - Database Documentation

## Overview

Pink Blueberry Salon uses PostgreSQL as its primary database with Prisma ORM for type-safe database access. The system is designed as a multi-tenant SaaS platform supporting 100,000+ concurrent users with enterprise-grade performance and security.

## Architecture

### Multi-Tenancy Strategy

- **Approach**: Shared database with row-level isolation
- **Implementation**: `tenant_id` column on all tenant-specific tables
- **Security**: PostgreSQL Row Level Security (RLS) policies
- **Performance**: Composite indexes on `(tenant_id, id)` for all tables

### Key Design Principles

1. **UUID Primary Keys**: Better distributed system compatibility
2. **Soft Deletes**: `deleted_at` timestamps for data recovery
3. **Audit Trails**: Comprehensive tracking with `created_at`, `updated_at`, `created_by`, `updated_by`
4. **Optimistic Locking**: Version fields for concurrent update handling
5. **JSON Fields**: Flexible metadata storage for extensibility

## Database Schema

### Core Domain Models

#### 1. Multi-Tenancy & Authentication

- **Tenant**: Root entity for multi-tenant isolation
- **User**: Authentication and user management
- **Role**: Role-based access control (RBAC)
- **Permission**: Granular permission management
- **UserRole**: Many-to-many user-role relationships
- **UserPermission**: Direct permission assignments

#### 2. Business Entities

- **Salon**: Main business entity
- **Branch**: Physical locations
- **Service**: Services offered
- **ServiceCategory**: Service categorization
- **WorkingHours**: Branch operating hours

#### 3. People Management

- **Customer**: Customer profiles and preferences
- **Staff**: Employee profiles
- **StaffService**: Staff-service assignments

#### 4. Scheduling & Appointments

- **Schedule**: Staff availability
- **TimeSlot**: Granular time slot management
- **Appointment**: Booking records
- **AppointmentService**: Services per appointment
- **TimeOffRequest**: Staff time-off management

#### 5. Commerce & Inventory

- **Product**: Product catalog
- **Inventory**: Stock management
- **Order**: Product orders
- **Payment**: Payment processing
- **Invoice**: Billing records
- **Refund**: Refund management

#### 6. Engagement & Marketing

- **Review**: Customer feedback
- **Campaign**: Marketing campaigns
- **Promotion**: Discount codes and offers
- **LoyaltyProgram**: Rewards program
- **LoyaltyPoints**: Customer points tracking

## Performance Optimizations

### Indexing Strategy

#### Primary Indexes
```sql
-- Composite indexes for multi-tenant queries
CREATE INDEX idx_[table]_tenant_id ON [table](tenant_id, id);
CREATE INDEX idx_[table]_tenant_deleted ON [table](tenant_id, deleted_at);
```

#### Performance Indexes
```sql
-- Appointment lookups
CREATE INDEX idx_appointments_branch_date ON appointments(branch_id, appointment_date);
CREATE INDEX idx_appointments_customer_date ON appointments(customer_id, appointment_date);
CREATE INDEX idx_appointments_staff_date ON appointments(staff_id, appointment_date);

-- Geo queries
CREATE INDEX idx_branches_location ON branches USING GIST(point(latitude, longitude));

-- Full-text search
CREATE INDEX idx_services_search ON services USING GIN(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_customers_search ON customers USING GIN(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));

-- Time-series data
CREATE INDEX idx_audit_logs_created ON audit_logs USING BRIN(created_at);
```

### Query Optimization

#### Connection Pooling
- **Max Connections**: 100 per instance
- **Pool Size**: 50 connections
- **Idle Timeout**: 10 seconds
- **Connection Lifetime**: 30 minutes

#### Caching Strategy
- **Query Result Cache**: Redis with 5-minute TTL
- **Session Cache**: In-memory for active sessions
- **Static Data Cache**: 1-hour TTL for categories, services

### Scaling Considerations

#### Horizontal Scaling
- **Read Replicas**: Up to 5 read replicas for load distribution
- **Connection Pooling**: PgBouncer for connection management
- **Partitioning**: Time-based partitioning for appointments and logs

#### Vertical Scaling
- **Instance Size**: Start with 8 vCPUs, 32GB RAM
- **Storage**: NVMe SSD with 10,000 IOPS
- **Auto-scaling**: Based on CPU and connection metrics

## Security

### Row Level Security (RLS)

```sql
-- Enable RLS on tenant-specific tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON customers
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Data Encryption

- **At Rest**: Transparent Data Encryption (TDE)
- **In Transit**: SSL/TLS with certificate validation
- **Sensitive Data**: Column-level encryption for PII

### Access Control

- **Database Users**: Separate users for app, admin, readonly
- **Connection Security**: IP whitelist, VPN access only
- **Audit Logging**: All data modifications tracked

## Backup & Recovery

### Backup Strategy

- **Full Backup**: Daily at 2 AM UTC
- **Incremental**: Every 6 hours
- **Transaction Logs**: Continuous archiving
- **Retention**: 30 days for full, 7 days for incremental

### Recovery Procedures

1. **Point-in-Time Recovery**: Up to 7 days
2. **Disaster Recovery**: Cross-region replication
3. **RPO**: < 5 minutes
4. **RTO**: < 1 hour

### Backup Commands

```bash
# Full backup
pg_dump -h localhost -U postgres -d pinkblueberry -F c -b -v -f backup.dump

# Restore
pg_restore -h localhost -U postgres -d pinkblueberry -v backup.dump

# Continuous archiving
archive_mode = on
archive_command = 'test ! -f /backup/%f && cp %p /backup/%f'
```

## Monitoring & Maintenance

### Key Metrics

- **Connection Pool Usage**: Alert at 80%
- **Query Performance**: Alert for queries > 1 second
- **Replication Lag**: Alert at > 10 seconds
- **Disk Usage**: Alert at 80%
- **Cache Hit Ratio**: Target > 95%

### Maintenance Tasks

#### Daily
- Analyze tables for query optimization
- Check replication status
- Review slow query log

#### Weekly
- Full vacuum on high-churn tables
- Update table statistics
- Review and optimize indexes

#### Monthly
- Full database vacuum
- Index rebuild
- Performance baseline review

### Monitoring Queries

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

## Migration Guide

### Setup Instructions

1. **Install Dependencies**
```bash
npm install @prisma/client prisma
npm install -D @types/node
```

2. **Environment Configuration**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pinkblueberry?schema=public"
DATABASE_POOL_SIZE=50
```

3. **Initialize Database**
```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Seed database (development only)
npx prisma db seed
```

4. **Production Deployment**
```bash
# Generate migration
npx prisma migrate dev --name your_migration_name

# Deploy to production
npx prisma migrate deploy
```

### Common Operations

#### Add New Model
```prisma
model NewModel {
  id         String    @id @default(uuid())
  tenant_id  String
  // ... fields
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  tenant Tenant @relation(fields: [tenant_id], references: [id])

  @@index([tenant_id, deleted_at])
  @@map("new_models")
}
```

#### Add Index
```prisma
@@index([field1, field2])
```

#### Add Unique Constraint
```prisma
@@unique([tenant_id, email])
```

## Performance Benchmarks

### Target Metrics

- **Read Latency**: < 10ms for indexed queries
- **Write Latency**: < 50ms for single row inserts
- **Bulk Operations**: 1000 rows/second
- **Concurrent Users**: 100,000+
- **Transactions/Second**: 10,000+

### Load Testing Results

- **Simple Queries**: 2-5ms average
- **Complex Joins**: 15-30ms average
- **Aggregations**: 50-100ms average
- **Full-Text Search**: 20-40ms average

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**
   - Increase pool size
   - Implement connection retry logic
   - Review long-running transactions

2. **Slow Queries**
   - Check missing indexes
   - Analyze query execution plans
   - Update table statistics

3. **Replication Lag**
   - Check network latency
   - Increase wal_keep_segments
   - Review replica hardware

4. **Lock Contention**
   - Implement optimistic locking
   - Reduce transaction scope
   - Use advisory locks for long operations

## Best Practices

1. **Always use transactions** for multi-table operations
2. **Implement retry logic** for transient failures
3. **Use prepared statements** to prevent SQL injection
4. **Monitor slow queries** and optimize regularly
5. **Keep indexes minimal** but effective
6. **Regular vacuum and analyze** for performance
7. **Use connection pooling** in production
8. **Implement circuit breakers** for database calls
9. **Cache frequently accessed** static data
10. **Document all schema changes** with migrations

## Support & Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs
- **Performance Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization
- **Security Best Practices**: https://www.postgresql.org/docs/current/security.html