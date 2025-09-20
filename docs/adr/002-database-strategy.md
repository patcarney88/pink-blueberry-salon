# ADR-002: Database Strategy and Data Management

## Status
Accepted

## Context
The system requires robust data management supporting multi-tenancy, high availability, and ACID compliance. We need to handle transactional data for bookings, payments, and customer information while maintaining performance for read-heavy operations like availability checks and reporting.

## Decision
We will implement a PostgreSQL-centric data strategy with the following architecture:

### Primary Database Technology
- **PostgreSQL 15+**: Primary database for all transactional data
- **Read Replicas**: Multiple read replicas for query load distribution
- **Connection Pooling**: PgBouncer for connection management
- **Sharding Strategy**: Tenant-based sharding for horizontal scaling

### Data Architecture Patterns
- **Database-per-Service**: Each bounded context has its own schema
- **Shared Database with Schema Isolation**: Tenant data isolation via schemas
- **Event Store Pattern**: PostgreSQL-based event store for event sourcing
- **CQRS Implementation**: Separate read/write models with projections

### Multi-Tenant Data Strategy
```sql
-- Tenant isolation via row-level security
CREATE POLICY tenant_isolation ON bookings
FOR ALL TO application_role
USING (tenant_id = current_setting('app.current_tenant_id'));

-- Tenant-specific schemas for complete isolation
CREATE SCHEMA tenant_123;
CREATE SCHEMA tenant_456;
```

### Data Access Patterns
- **Write Operations**: Always to primary database
- **Read Operations**: Load-balanced across read replicas
- **Reporting Queries**: Dedicated analytics replica
- **Cache Strategy**: Redis for frequently accessed data

## Implementation Details

### Connection Management
```typescript
// Multi-pool configuration
const writePool = new Pool(writeConfig);
const readPools = readConfigs.map(config => new Pool(config));

// Round-robin read distribution
function getReadConnection() {
  return readPools[currentIndex++ % readPools.length];
}
```

### Event Store Schema
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX events_stream_version
ON events (stream_id, version);

CREATE INDEX events_tenant_timestamp
ON events (tenant_id, timestamp);
```

### Performance Optimizations
- **Materialized Views**: For complex reporting queries
- **Partial Indexes**: On frequently filtered columns
- **JSON Indexing**: GIN indexes on JSONB columns
- **Query Caching**: Application-level caching for read operations

## Consequences

### Positive
- **ACID Compliance**: Full transactional guarantees
- **Mature Ecosystem**: Rich PostgreSQL tooling and extensions
- **Horizontal Scaling**: Read replicas and sharding support
- **JSON Support**: Native JSON handling for flexible schemas
- **Strong Consistency**: Immediate consistency for critical operations
- **Security**: Row-level security for tenant isolation

### Negative
- **Complexity**: Managing multiple database connections
- **Operational Overhead**: Monitoring and maintaining replicas
- **Eventual Consistency**: Read replicas may lag behind primary
- **Resource Usage**: Higher memory and CPU requirements
- **Cost**: Multiple database instances increase costs

## Alternatives Considered

### Rejected: Supabase
- **Reason**: Project requirements explicitly prohibit Supabase
- **Concerns**: Vendor lock-in, limited control over infrastructure

### Rejected: DynamoDB
- **Reason**: Project requirements prohibit non-PostgreSQL databases
- **Concerns**: NoSQL limitations for complex transactions

### Rejected: Multi-Database Strategy
- **Reason**: Increases operational complexity
- **Concerns**: Cross-database transactions, data consistency

## Migration Strategy
1. **Phase 1**: Single PostgreSQL instance with connection pooling
2. **Phase 2**: Add read replicas for query distribution
3. **Phase 3**: Implement tenant-based sharding
4. **Phase 4**: Geographic distribution with regional replicas

## Compliance Requirements
- **Data Residency**: Support for geographic data location requirements
- **GDPR**: Right to be forgotten with soft deletion patterns
- **HIPAA**: Encryption at rest and in transit
- **PCI DSS**: Secure payment data handling (tokenization)

## Monitoring and Observability
- **Query Performance**: Slow query logging and analysis
- **Connection Health**: Pool utilization and connection leaks
- **Replication Lag**: Monitor read replica synchronization
- **Storage Growth**: Automatic archival and cleanup policies