# Infrastructure & Deployment Architecture

## Pink Blueberry Salon - AWS & Vercel Infrastructure

This document provides a comprehensive infrastructure and deployment strategy for the Pink Blueberry Salon platform, optimized for Vercel deployment with AWS service integration.

## Infrastructure Overview

```mermaid
graph TB
    subgraph "User Access Layer"
        USERS[Users]
        MOBILE[Mobile Devices]
        POS[POS Systems]
    end

    subgraph "CDN & Edge Network"
        CF[Cloudflare CDN]
        VERCEL[Vercel Edge Network]
        EDGE_FUNC[Edge Functions]
    end

    subgraph "Application Layer - Vercel"
        NEXT[Next.js Application]
        API[API Routes]
        SSG[Static Pages]
        ISR[ISR Pages]
    end

    subgraph "AWS Services"
        subgraph "Compute & Storage"
            LAMBDA[Lambda Functions]
            S3[S3 Storage]
            EFS[EFS File System]
        end

        subgraph "Database"
            RDS[(RDS PostgreSQL)]
            REPLICA[(Read Replicas)]
            REDIS[(ElastiCache Redis)]
        end

        subgraph "Messaging & Events"
            SQS[SQS Queues]
            SNS[SNS Topics]
            EVENTBRIDGE[EventBridge]
        end

        subgraph "AI/ML Services"
            REKOGNITION[Rekognition]
            COMPREHEND[Comprehend]
            FORECAST[Forecast]
        end
    end

    subgraph "Monitoring & Security"
        CW[CloudWatch]
        XRAY[X-Ray]
        WAF[AWS WAF]
        SHIELD[Shield]
        SECRETS[Secrets Manager]
    end

    USERS --> CF
    CF --> VERCEL
    VERCEL --> NEXT
    NEXT --> API
    API --> RDS
    API --> REDIS
    API --> LAMBDA
    LAMBDA --> SQS
    SQS --> SNS
```

## Vercel Deployment Configuration

### Project Structure

```yaml
vercel-deployment:
  framework: nextjs
  build_command: pnpm build
  output_directory: .next
  install_command: pnpm install
  development_command: pnpm dev

  regions:
    - iad1  # US East (N. Virginia)
    - sfo1  # US West (N. California)
    - sin1  # Asia (Singapore)
    - fra1  # Europe (Frankfurt)

  environment_variables:
    production:
      DATABASE_URL: "@rds-connection-string"
      REDIS_URL: "@elasticache-connection"
      AWS_REGION: "us-east-1"
      STRIPE_SECRET_KEY: "@stripe-secret"
      NEXTAUTH_SECRET: "@nextauth-secret"

    preview:
      DATABASE_URL: "@rds-staging-connection"
      REDIS_URL: "@elasticache-staging"
      AWS_REGION: "us-east-1"
```

### Edge Functions Configuration

```typescript
// vercel.json
{
  "functions": {
    "app/api/bookings/availability/route.ts": {
      "maxDuration": 10,
      "memory": 1024,
      "regions": ["iad1", "sfo1"]
    },
    "app/api/payments/webhook/route.ts": {
      "maxDuration": 30,
      "memory": 512,
      "regions": ["iad1"]
    },
    "app/api/analytics/generate/route.ts": {
      "maxDuration": 60,
      "memory": 3008,
      "schedule": "0 2 * * *"
    },
    "app/api/ai/recommendations/route.ts": {
      "maxDuration": 30,
      "memory": 1024,
      "runtime": "edge"
    }
  },

  "rewrites": [
    {
      "source": "/api/socket/:path*",
      "destination": "https://ws.pinkblueberry.com/:path*"
    }
  ],

  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=60, stale-while-revalidate=300" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com wss://ws.pinkblueberry.com"
        }
      ]
    }
  ],

  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/sync-inventory",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/generate-reports",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 3 * * *"
    }
  ]
}
```

## AWS Infrastructure

### Infrastructure as Code (CDK)

```typescript
// infrastructure/cdk/lib/pink-blueberry-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as waf from 'aws-cdk-lib/aws-wafv2';

export class PinkBlueberryStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC Configuration
    const vpc = new ec2.Vpc(this, 'PinkBlueberryVPC', {
      maxAzs: 3,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });

    // RDS PostgreSQL Database
    const dbCluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3
      }),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      instanceProps: {
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.LARGE
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      },
      instances: 2, // Primary + Read Replica
      backup: {
        retention: cdk.Duration.days(30),
        preferredWindow: '03:00-04:00'
      },
      storageEncrypted: true,
      cloudwatchLogsExports: ['postgresql'],
      defaultDatabaseName: 'pinkblueberry'
    });

    // Add read replicas for different regions
    const readReplica = new rds.CfnDBInstance(this, 'ReadReplica', {
      sourceDbInstanceIdentifier: dbCluster.clusterIdentifier,
      dbInstanceClass: 'db.r6g.large',
      publiclyAccessible: false
    });

    // ElastiCache Redis Cluster
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for Redis cluster',
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
      }
    );

    const redisCluster = new elasticache.CfnReplicationGroup(
      this,
      'RedisCluster',
      {
        replicationGroupDescription: 'Pink Blueberry Redis Cache',
        engine: 'redis',
        engineVersion: '7.0',
        cacheNodeType: 'cache.r6g.large',
        numCacheClusters: 3,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        cacheSubnetGroupName: redisSubnetGroup.ref,
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        snapshotRetentionLimit: 7,
        snapshotWindow: '03:00-05:00',
        preferredMaintenanceWindow: 'sun:05:00-sun:06:00'
      }
    );

    // S3 Buckets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: 'pink-blueberry-assets',
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90)
        },
        {
          id: 'intelligent-tiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30)
            }
          ]
        }
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST
          ],
          allowedOrigins: ['https://*.pinkblueberry.com'],
          allowedHeaders: ['*']
        }
      ]
    });

    // CloudFront Distribution for S3
    const cdn = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: new cloudfront.origins.S3Origin(assetsBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      domainNames: ['cdn.pinkblueberry.com'],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3
    });

    // Lambda Functions for Background Jobs
    const processBookingLambda = new lambda.Function(
      this,
      'ProcessBookingFunction',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'booking.handler',
        code: lambda.Code.fromAsset('lambda/booking'),
        environment: {
          DATABASE_URL: dbCluster.clusterEndpoint.socketAddress,
          REDIS_URL: redisCluster.attrPrimaryEndPointAddress
        },
        vpc,
        timeout: cdk.Duration.seconds(30),
        memorySize: 1024,
        reservedConcurrentExecutions: 10
      }
    );

    // SQS Queues
    const bookingQueue = new sqs.Queue(this, 'BookingQueue', {
      queueName: 'pink-blueberry-bookings',
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: new sqs.Queue(this, 'BookingDLQ', {
          queueName: 'pink-blueberry-bookings-dlq'
        })
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED
    });

    // SNS Topics
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: 'pink-blueberry-notifications',
      displayName: 'Pink Blueberry Notifications'
    });

    // EventBridge for Event-Driven Architecture
    const eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: 'pink-blueberry-events'
    });

    // Event Rules
    new events.Rule(this, 'BookingCreatedRule', {
      eventBus,
      eventPattern: {
        source: ['booking.service'],
        detailType: ['Booking Created']
      },
      targets: [
        new events.targets.LambdaFunction(processBookingLambda),
        new events.targets.SnsTopic(notificationTopic)
      ]
    });

    // WAF Web ACL
    const webAcl = new waf.CfnWebACL(this, 'WebACL', {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP'
            }
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule'
          }
        },
        {
          name: 'SQLiRule',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet'
            }
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRule'
          }
        }
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'WebACL'
      }
    });

    // Secrets Manager
    const apiKeys = new secretsmanager.Secret(this, 'APIKeys', {
      secretName: 'pink-blueberry/api-keys',
      description: 'API keys for Pink Blueberry services',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          stripe: '',
          twilio: '',
          sendgrid: ''
        }),
        generateStringKey: 'random'
      }
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.socketAddress,
      description: 'RDS Cluster Endpoint'
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrPrimaryEndPointAddress,
      description: 'Redis Primary Endpoint'
    });

    new cdk.CfnOutput(this, 'CDNDomain', {
      value: cdn.distributionDomainName,
      description: 'CloudFront Distribution Domain'
    });
  }
}
```

## Database Scaling Strategy

### Multi-Region Database Architecture

```yaml
database_architecture:
  primary_region: us-east-1

  primary_cluster:
    engine: Aurora PostgreSQL 15.3
    instance_type: db.r6g.xlarge
    instances: 2
    storage_encrypted: true
    backup_retention: 30 days

  read_replicas:
    - region: us-west-2
      instance_type: db.r6g.large
      instances: 1

    - region: eu-west-1
      instance_type: db.r6g.large
      instances: 1

    - region: ap-southeast-1
      instance_type: db.r6g.large
      instances: 1

  connection_pooling:
    tool: PgBouncer
    pool_mode: transaction
    max_connections: 100
    default_pool_size: 25

  performance_insights:
    enabled: true
    retention_period: 7 days
```

### Database Connection Management

```typescript
// lib/db/connection-pool.ts
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  private writePool: Pool;
  private readPools: Pool[];
  private currentReadIndex = 0;
  private prismaWrite: PrismaClient;
  private prismaRead: PrismaClient[];

  constructor() {
    // Write pool (primary database)
    this.writePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false }
    });

    // Read pools (replicas)
    const readUrls = process.env.READ_REPLICA_URLS?.split(',') || [];
    this.readPools = readUrls.map(url => new Pool({
      connectionString: url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false }
    }));

    // Prisma clients
    this.prismaWrite = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL }
      }
    });

    this.prismaRead = readUrls.map(url => new PrismaClient({
      datasources: {
        db: { url }
      }
    }));
  }

  getWriteConnection() {
    return this.prismaWrite;
  }

  getReadConnection() {
    if (this.prismaRead.length === 0) {
      return this.prismaWrite;
    }

    // Round-robin read replicas
    const connection = this.prismaRead[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.prismaRead.length;
    return connection;
  }

  async healthCheck() {
    try {
      await this.writePool.query('SELECT 1');
      await Promise.all(this.readPools.map(pool => pool.query('SELECT 1')));
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error };
    }
  }

  async disconnect() {
    await this.writePool.end();
    await Promise.all(this.readPools.map(pool => pool.end()));
    await this.prismaWrite.$disconnect();
    await Promise.all(this.prismaRead.map(client => client.$disconnect()));
  }
}

export const db = new DatabaseManager();
```

## Caching Infrastructure

### Multi-Layer Cache Strategy

```typescript
// lib/cache/cache-manager.ts
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

export class CacheManager {
  private l1Cache: LRUCache<string, any>; // In-memory cache
  private l2Cache: Redis; // Redis cache
  private l3Cache: CloudFrontCache; // CDN cache

  constructor() {
    // L1: In-memory LRU cache
    this.l1Cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60, // 1 minute
      updateAgeOnGet: true
    });

    // L2: Redis cluster
    this.l2Cache = new Redis.Cluster([
      {
        host: process.env.REDIS_HOST_1,
        port: 6379
      },
      {
        host: process.env.REDIS_HOST_2,
        port: 6379
      },
      {
        host: process.env.REDIS_HOST_3,
        port: 6379
      }
    ], {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        tls: {}
      },
      clusterRetryStrategy: (times) => Math.min(times * 100, 2000)
    });

    // L3: CDN cache headers
    this.l3Cache = new CloudFrontCache();
  }

  async get<T>(key: string): Promise<T | null> {
    // Check L1
    const l1Result = this.l1Cache.get(key);
    if (l1Result !== undefined) {
      return l1Result;
    }

    // Check L2
    const l2Result = await this.l2Cache.get(key);
    if (l2Result) {
      const parsed = JSON.parse(l2Result);
      this.l1Cache.set(key, parsed); // Populate L1
      return parsed;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);

    // Set in L1
    this.l1Cache.set(key, value);

    // Set in L2
    await this.l2Cache.setex(key, ttl, serialized);

    // L3 handled via response headers
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear L1
    for (const key of this.l1Cache.keys()) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key);
      }
    }

    // Clear L2
    const keys = await this.l2Cache.keys(pattern);
    if (keys.length > 0) {
      await this.l2Cache.del(...keys);
    }

    // L3 invalidation via CloudFront API
    await this.l3Cache.createInvalidation(pattern);
  }
}

class CloudFrontCache {
  async createInvalidation(path: string) {
    // CloudFront invalidation logic
    const cloudfront = new AWS.CloudFront();

    await cloudfront.createInvalidation({
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: [path]
        }
      }
    }).promise();
  }
}
```

## Monitoring & Observability

### CloudWatch Configuration

```typescript
// lib/monitoring/cloudwatch.ts
import { CloudWatch, CloudWatchLogs } from 'aws-sdk';

export class MonitoringService {
  private cloudWatch: CloudWatch;
  private cloudWatchLogs: CloudWatchLogs;

  constructor() {
    this.cloudWatch = new CloudWatch({
      region: process.env.AWS_REGION
    });

    this.cloudWatchLogs = new CloudWatchLogs({
      region: process.env.AWS_REGION
    });
  }

  async recordMetric(
    namespace: string,
    metricName: string,
    value: number,
    unit: string = 'Count',
    dimensions?: Record<string, string>
  ) {
    const params = {
      Namespace: namespace,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: dimensions
            ? Object.entries(dimensions).map(([name, value]) => ({
                Name: name,
                Value: value
              }))
            : undefined
        }
      ]
    };

    await this.cloudWatch.putMetricData(params).promise();
  }

  async createAlarm(config: AlarmConfig) {
    const params = {
      AlarmName: config.name,
      ComparisonOperator: config.comparisonOperator,
      EvaluationPeriods: config.evaluationPeriods,
      MetricName: config.metricName,
      Namespace: config.namespace,
      Period: config.period,
      Statistic: config.statistic,
      Threshold: config.threshold,
      ActionsEnabled: true,
      AlarmActions: [config.snsTopicArn],
      AlarmDescription: config.description
    };

    await this.cloudWatch.putMetricAlarm(params).promise();
  }

  async log(logGroup: string, logStream: string, message: any) {
    const params = {
      logGroupName: logGroup,
      logStreamName: logStream,
      logEvents: [
        {
          message: JSON.stringify(message),
          timestamp: Date.now()
        }
      ]
    };

    try {
      await this.cloudWatchLogs.putLogEvents(params).promise();
    } catch (error) {
      console.error('Failed to log to CloudWatch:', error);
    }
  }
}

interface AlarmConfig {
  name: string;
  namespace: string;
  metricName: string;
  comparisonOperator: string;
  threshold: number;
  evaluationPeriods: number;
  period: number;
  statistic: string;
  description: string;
  snsTopicArn: string;
}

// Monitoring setup
export async function setupMonitoring() {
  const monitoring = new MonitoringService();

  // Database alarms
  await monitoring.createAlarm({
    name: 'HighDatabaseConnections',
    namespace: 'AWS/RDS',
    metricName: 'DatabaseConnections',
    comparisonOperator: 'GreaterThanThreshold',
    threshold: 80,
    evaluationPeriods: 2,
    period: 300,
    statistic: 'Average',
    description: 'Alert when database connections are high',
    snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN
  });

  // API alarms
  await monitoring.createAlarm({
    name: 'HighAPILatency',
    namespace: 'PinkBlueberry/API',
    metricName: 'Latency',
    comparisonOperator: 'GreaterThanThreshold',
    threshold: 1000,
    evaluationPeriods: 2,
    period: 60,
    statistic: 'Average',
    description: 'Alert when API latency exceeds 1 second',
    snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN
  });

  // Error rate alarms
  await monitoring.createAlarm({
    name: 'HighErrorRate',
    namespace: 'PinkBlueberry/API',
    metricName: 'ErrorRate',
    comparisonOperator: 'GreaterThanThreshold',
    threshold: 1,
    evaluationPeriods: 1,
    period: 60,
    statistic: 'Average',
    description: 'Alert when error rate exceeds 1%',
    snsTopicArn: process.env.ALERT_SNS_TOPIC_ARN
  });
}
```

### Application Performance Monitoring

```typescript
// lib/monitoring/apm.ts
import * as Sentry from '@sentry/nextjs';
import { metrics } from '@opentelemetry/api';

export class APM {
  private meter = metrics.getMeter('pink-blueberry');

  constructor() {
    // Initialize Sentry
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false
        })
      ],
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        return event;
      }
    });

    // Custom metrics
    this.setupCustomMetrics();
  }

  private setupCustomMetrics() {
    // Booking metrics
    this.bookingCounter = this.meter.createCounter('bookings.created');
    this.bookingDuration = this.meter.createHistogram('bookings.duration');

    // Revenue metrics
    this.revenueGauge = this.meter.createObservableGauge('revenue.daily');

    // Performance metrics
    this.apiLatency = this.meter.createHistogram('api.latency');
    this.dbQueryTime = this.meter.createHistogram('db.query.time');
  }

  recordBooking(branchId: string, amount: number) {
    this.bookingCounter.add(1, { branch: branchId });
    this.revenueGauge.record(amount, { branch: branchId });
  }

  recordAPICall(endpoint: string, duration: number, statusCode: number) {
    this.apiLatency.record(duration, {
      endpoint,
      status: statusCode.toString(),
      method: 'GET'
    });
  }

  recordDatabaseQuery(query: string, duration: number) {
    this.dbQueryTime.record(duration, {
      query: query.substring(0, 50)
    });
  }

  captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context
    });
  }

  startTransaction(name: string) {
    return Sentry.startTransaction({
      name,
      op: 'transaction'
    });
  }
}

export const apm = new APM();
```

## Deployment Pipeline

### CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linting
        run: pnpm lint

      - name: Run type check
        run: pnpm type-check

      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          TEST_URL: http://localhost:3000

  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run security audit
        run: pnpm audit --audit-level=high

      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'pink-blueberry'
          path: '.'
          format: 'HTML'

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  deploy-preview:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v3

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Preview
        run: |
          vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }} > deployment-url.txt
          echo "DEPLOYMENT_URL=$(cat deployment-url.txt)" >> $GITHUB_ENV

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployment ready at: ${process.env.DEPLOYMENT_URL}`
            })

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v3

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run database migrations
        run: |
          pnpm prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Deploy to Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Purge CDN Cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Send deployment notification
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"✅ Production deployment completed successfully"}'
```

## Disaster Recovery

### Backup Strategy

```yaml
backup_strategy:
  databases:
    automated_backups:
      enabled: true
      retention_period: 30 days
      backup_window: "03:00-04:00 UTC"

    point_in_time_recovery:
      enabled: true
      retention_period: 7 days

    cross_region_backups:
      enabled: true
      target_regions:
        - us-west-2
        - eu-west-1

    manual_snapshots:
      frequency: weekly
      retention: 90 days

  application_data:
    s3_versioning:
      enabled: true
      mfa_delete: true

    s3_replication:
      enabled: true
      destination_region: us-west-2

    glacier_archival:
      enabled: true
      transition_days: 90

  recovery_objectives:
    rto: 4 hours  # Recovery Time Objective
    rpo: 1 hour   # Recovery Point Objective
```

### Failover Strategy

```typescript
// lib/failover/health-check.ts
export class HealthCheckService {
  async performHealthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkS3(),
      this.checkAPI()
    ]);

    const status: HealthStatus = {
      healthy: true,
      services: {}
    };

    checks.forEach((check, index) => {
      const serviceName = ['database', 'redis', 's3', 'api'][index];

      if (check.status === 'fulfilled') {
        status.services[serviceName] = {
          status: 'healthy',
          latency: check.value.latency
        };
      } else {
        status.healthy = false;
        status.services[serviceName] = {
          status: 'unhealthy',
          error: check.reason
        };
      }
    });

    // Trigger failover if critical services are down
    if (!status.services.database?.status === 'healthy') {
      await this.triggerDatabaseFailover();
    }

    return status;
  }

  private async triggerDatabaseFailover() {
    // Promote read replica to primary
    const rds = new AWS.RDS();

    await rds.promoteReadReplica({
      DBInstanceIdentifier: process.env.STANDBY_DB_INSTANCE_ID,
      BackupRetentionPeriod: 7
    }).promise();

    // Update application configuration
    await this.updateDatabaseEndpoint();

    // Notify operations team
    await this.sendAlert('Database failover initiated');
  }
}
```

## Cost Optimization

### Resource Optimization Strategy

```yaml
cost_optimization:
  compute:
    vercel:
      plan: Enterprise
      optimization:
        - Use ISR for static content
        - Edge functions for lightweight operations
        - API route caching

    lambda:
      optimization:
        - Reserved concurrency for predictable workloads
        - ARM-based Graviton2 processors
        - Memory optimization based on profiling

  storage:
    s3:
      optimization:
        - Intelligent tiering
        - Lifecycle policies
        - Compression for large objects

    database:
      optimization:
        - Reserved instances (1-year term)
        - Right-sizing based on metrics
        - Automated scaling policies

  network:
    optimization:
      - CloudFront caching
      - Compression at edge
      - Connection pooling

  monitoring:
    cost_alerts:
      - Daily spend > $500
      - Monthly forecast > $10,000
      - Unusual spike detection
```

This comprehensive infrastructure and deployment architecture provides:

1. **High Availability**: Multi-region deployment with automatic failover
2. **Scalability**: Auto-scaling at all layers
3. **Security**: WAF, encryption, and security scanning
4. **Performance**: Multi-layer caching and CDN
5. **Observability**: Comprehensive monitoring and alerting
6. **Cost Optimization**: Reserved instances and intelligent tiering
7. **Disaster Recovery**: Automated backups and failover procedures