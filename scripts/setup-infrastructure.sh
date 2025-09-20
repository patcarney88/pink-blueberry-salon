#!/bin/bash

# Pink Blueberry Salon Infrastructure Setup Script
# Usage: ./scripts/setup-infrastructure.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="pink-blueberry"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

create_vpc() {
    log_info "Creating VPC..."

    # Create VPC
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --region ${AWS_REGION} \
        --query 'Vpc.VpcId' \
        --output text)

    log_info "VPC created: ${VPC_ID}"

    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute \
        --vpc-id ${VPC_ID} \
        --enable-dns-hostnames \
        --region ${AWS_REGION}

    # Create Internet Gateway
    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw-${ENVIRONMENT}}]" \
        --region ${AWS_REGION} \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)

    # Attach Internet Gateway to VPC
    aws ec2 attach-internet-gateway \
        --vpc-id ${VPC_ID} \
        --internet-gateway-id ${IGW_ID} \
        --region ${AWS_REGION}

    log_info "Internet Gateway created and attached: ${IGW_ID}"
}

create_subnets() {
    log_info "Creating subnets..."

    # Get availability zones
    AZS=$(aws ec2 describe-availability-zones \
        --region ${AWS_REGION} \
        --query 'AvailabilityZones[0:2].ZoneName' \
        --output text)

    AZ1=$(echo ${AZS} | awk '{print $1}')
    AZ2=$(echo ${AZS} | awk '{print $2}')

    # Create public subnets
    PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block 10.0.1.0/24 \
        --availability-zone ${AZ1} \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}},{Key=Type,Value=public}]" \
        --region ${AWS_REGION} \
        --query 'Subnet.SubnetId' \
        --output text)

    PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block 10.0.2.0/24 \
        --availability-zone ${AZ2} \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-2-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}},{Key=Type,Value=public}]" \
        --region ${AWS_REGION} \
        --query 'Subnet.SubnetId' \
        --output text)

    # Create private subnets
    PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block 10.0.10.0/24 \
        --availability-zone ${AZ1} \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-1-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}},{Key=Type,Value=private}]" \
        --region ${AWS_REGION} \
        --query 'Subnet.SubnetId' \
        --output text)

    PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block 10.0.11.0/24 \
        --availability-zone ${AZ2} \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-subnet-2-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}},{Key=Type,Value=private}]" \
        --region ${AWS_REGION} \
        --query 'Subnet.SubnetId' \
        --output text)

    log_info "Subnets created"

    # Enable auto-assign public IP for public subnets
    aws ec2 modify-subnet-attribute \
        --subnet-id ${PUBLIC_SUBNET_1} \
        --map-public-ip-on-launch \
        --region ${AWS_REGION}

    aws ec2 modify-subnet-attribute \
        --subnet-id ${PUBLIC_SUBNET_2} \
        --map-public-ip-on-launch \
        --region ${AWS_REGION}
}

create_route_tables() {
    log_info "Creating route tables..."

    # Create route table for public subnets
    PUBLIC_RT=$(aws ec2 create-route-table \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt-${ENVIRONMENT}}]" \
        --region ${AWS_REGION} \
        --query 'RouteTable.RouteTableId' \
        --output text)

    # Add route to Internet Gateway
    aws ec2 create-route \
        --route-table-id ${PUBLIC_RT} \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id ${IGW_ID} \
        --region ${AWS_REGION}

    # Associate public subnets with public route table
    aws ec2 associate-route-table \
        --route-table-id ${PUBLIC_RT} \
        --subnet-id ${PUBLIC_SUBNET_1} \
        --region ${AWS_REGION}

    aws ec2 associate-route-table \
        --route-table-id ${PUBLIC_RT} \
        --subnet-id ${PUBLIC_SUBNET_2} \
        --region ${AWS_REGION}

    log_info "Route tables created and associated"
}

create_security_groups() {
    log_info "Creating security groups..."

    # Create ALB security group
    ALB_SG=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-alb-sg-${ENVIRONMENT} \
        --description "Security group for ALB" \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-alb-sg-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --region ${AWS_REGION} \
        --query 'GroupId' \
        --output text)

    # Allow HTTP and HTTPS traffic
    aws ec2 authorize-security-group-ingress \
        --group-id ${ALB_SG} \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION}

    aws ec2 authorize-security-group-ingress \
        --group-id ${ALB_SG} \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION}

    # Create ECS tasks security group
    ECS_SG=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-ecs-sg-${ENVIRONMENT} \
        --description "Security group for ECS tasks" \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-ecs-sg-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --region ${AWS_REGION} \
        --query 'GroupId' \
        --output text)

    # Allow traffic from ALB
    aws ec2 authorize-security-group-ingress \
        --group-id ${ECS_SG} \
        --protocol tcp \
        --port 3000 \
        --source-group ${ALB_SG} \
        --region ${AWS_REGION}

    # Create RDS security group
    RDS_SG=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-rds-sg-${ENVIRONMENT} \
        --description "Security group for RDS" \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-rds-sg-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --region ${AWS_REGION} \
        --query 'GroupId' \
        --output text)

    # Allow PostgreSQL traffic from ECS tasks
    aws ec2 authorize-security-group-ingress \
        --group-id ${RDS_SG} \
        --protocol tcp \
        --port 5432 \
        --source-group ${ECS_SG} \
        --region ${AWS_REGION}

    # Create ElastiCache security group
    REDIS_SG=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-redis-sg-${ENVIRONMENT} \
        --description "Security group for ElastiCache Redis" \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-redis-sg-${ENVIRONMENT}},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --region ${AWS_REGION} \
        --query 'GroupId' \
        --output text)

    # Allow Redis traffic from ECS tasks
    aws ec2 authorize-security-group-ingress \
        --group-id ${REDIS_SG} \
        --protocol tcp \
        --port 6379 \
        --source-group ${ECS_SG} \
        --region ${AWS_REGION}

    log_info "Security groups created"
}

create_rds_instance() {
    log_info "Creating RDS PostgreSQL instance..."

    # Create DB subnet group
    aws rds create-db-subnet-group \
        --db-subnet-group-name ${PROJECT_NAME}-db-subnet-${ENVIRONMENT} \
        --db-subnet-group-description "Subnet group for RDS" \
        --subnet-ids ${PRIVATE_SUBNET_1} ${PRIVATE_SUBNET_2} \
        --tags "Key=Environment,Value=${ENVIRONMENT}" \
        --region ${AWS_REGION}

    # Create RDS instance
    aws rds create-db-instance \
        --db-instance-identifier ${PROJECT_NAME}-db-${ENVIRONMENT} \
        --db-instance-class db.t3.small \
        --engine postgres \
        --engine-version 15.3 \
        --master-username postgres \
        --master-user-password $(openssl rand -base64 32) \
        --allocated-storage 20 \
        --storage-type gp3 \
        --storage-encrypted \
        --vpc-security-group-ids ${RDS_SG} \
        --db-subnet-group-name ${PROJECT_NAME}-db-subnet-${ENVIRONMENT} \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --preferred-maintenance-window "sun:04:00-sun:05:00" \
        --multi-az \
        --tags "Key=Environment,Value=${ENVIRONMENT}" \
        --region ${AWS_REGION}

    log_info "RDS instance creation initiated"
}

create_elasticache_cluster() {
    log_info "Creating ElastiCache Redis cluster..."

    # Create cache subnet group
    aws elasticache create-cache-subnet-group \
        --cache-subnet-group-name ${PROJECT_NAME}-cache-subnet-${ENVIRONMENT} \
        --cache-subnet-group-description "Subnet group for ElastiCache" \
        --subnet-ids ${PRIVATE_SUBNET_1} ${PRIVATE_SUBNET_2} \
        --region ${AWS_REGION}

    # Create Redis replication group
    aws elasticache create-replication-group \
        --replication-group-id ${PROJECT_NAME}-redis-${ENVIRONMENT} \
        --replication-group-description "Redis cluster for Pink Blueberry Salon" \
        --cache-node-type cache.t3.micro \
        --engine redis \
        --engine-version 7.0 \
        --num-cache-clusters 2 \
        --automatic-failover-enabled \
        --cache-subnet-group-name ${PROJECT_NAME}-cache-subnet-${ENVIRONMENT} \
        --security-group-ids ${REDIS_SG} \
        --at-rest-encryption-enabled \
        --transit-encryption-enabled \
        --tags "Key=Environment,Value=${ENVIRONMENT}" \
        --region ${AWS_REGION}

    log_info "ElastiCache cluster creation initiated"
}

create_ecr_repository() {
    log_info "Creating ECR repository..."

    # Create ECR repository
    aws ecr create-repository \
        --repository-name ${PROJECT_NAME}-salon \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        --tags "Key=Environment,Value=${ENVIRONMENT}" \
        --region ${AWS_REGION}

    # Set lifecycle policy
    aws ecr put-lifecycle-policy \
        --repository-name ${PROJECT_NAME}-salon \
        --lifecycle-policy-text '{
            "rules": [{
                "rulePriority": 1,
                "description": "Keep last 10 images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 10
                },
                "action": {
                    "type": "expire"
                }
            }]
        }' \
        --region ${AWS_REGION}

    log_info "ECR repository created"
}

create_ecs_cluster() {
    log_info "Creating ECS cluster..."

    # Create ECS cluster
    aws ecs create-cluster \
        --cluster-name ${PROJECT_NAME}-cluster-${ENVIRONMENT} \
        --capacity-providers FARGATE FARGATE_SPOT \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1,base=1 \
        --tags "key=Environment,value=${ENVIRONMENT}" \
        --region ${AWS_REGION}

    log_info "ECS cluster created"
}

create_alb() {
    log_info "Creating Application Load Balancer..."

    # Create ALB
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name ${PROJECT_NAME}-alb-${ENVIRONMENT} \
        --subnets ${PUBLIC_SUBNET_1} ${PUBLIC_SUBNET_2} \
        --security-groups ${ALB_SG} \
        --tags "Key=Environment,Value=${ENVIRONMENT}" \
        --region ${AWS_REGION} \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text)

    # Create target group
    TG_ARN=$(aws elbv2 create-target-group \
        --name ${PROJECT_NAME}-tg-${ENVIRONMENT} \
        --protocol HTTP \
        --port 3000 \
        --vpc-id ${VPC_ID} \
        --target-type ip \
        --health-check-protocol HTTP \
        --health-check-path /api/health \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --tags "Key=Environment,Value=${ENVIRONMENT}" \
        --region ${AWS_REGION} \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text)

    # Create listener
    aws elbv2 create-listener \
        --load-balancer-arn ${ALB_ARN} \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn=${TG_ARN} \
        --region ${AWS_REGION}

    log_info "Application Load Balancer created"
}

output_configuration() {
    log_info "Infrastructure setup complete!"
    echo ""
    echo "================================="
    echo "Infrastructure Configuration"
    echo "================================="
    echo "Environment: ${ENVIRONMENT}"
    echo "Region: ${AWS_REGION}"
    echo ""
    echo "VPC ID: ${VPC_ID}"
    echo "Public Subnet 1: ${PUBLIC_SUBNET_1}"
    echo "Public Subnet 2: ${PUBLIC_SUBNET_2}"
    echo "Private Subnet 1: ${PRIVATE_SUBNET_1}"
    echo "Private Subnet 2: ${PRIVATE_SUBNET_2}"
    echo ""
    echo "Security Groups:"
    echo "  ALB: ${ALB_SG}"
    echo "  ECS: ${ECS_SG}"
    echo "  RDS: ${RDS_SG}"
    echo "  Redis: ${REDIS_SG}"
    echo ""
    echo "Load Balancer ARN: ${ALB_ARN}"
    echo "Target Group ARN: ${TG_ARN}"
    echo ""
    echo "================================="
    echo ""
    echo "Please save this configuration for future reference."
}

# Main function
main() {
    log_info "Setting up infrastructure for Pink Blueberry Salon"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Region: ${AWS_REGION}"

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured"
        exit 1
    fi

    # Create infrastructure components
    create_vpc
    create_subnets
    create_route_tables
    create_security_groups
    create_rds_instance
    create_elasticache_cluster
    create_ecr_repository
    create_ecs_cluster
    create_alb

    # Output configuration
    output_configuration
}

# Run main function
main