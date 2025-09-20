#!/bin/bash

# Pink Blueberry Salon Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-$(git rev-parse --short HEAD)}
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY="pink-blueberry-salon"
ECS_CLUSTER="pink-blueberry-cluster-${ENVIRONMENT}"
ECS_SERVICE="pink-blueberry-service-${ENVIRONMENT}"
TASK_FAMILY="pink-blueberry-task"

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

check_requirements() {
    log_info "Checking requirements..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured"
        exit 1
    fi

    log_info "All requirements met"
}

build_and_push_image() {
    log_info "Building Docker image..."

    # Get ECR login token
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

    # Get ECR registry URL
    ECR_REGISTRY=$(aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} --query 'repositories[0].repositoryUri' --output text | cut -d'/' -f1)

    # Build image
    docker build \
        --build-arg NODE_ENV=production \
        --build-arg NEXT_PUBLIC_APP_URL=https://${ENVIRONMENT}.pink-blueberry.com \
        -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:${VERSION} \
        -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest \
        .

    # Push image
    log_info "Pushing Docker image to ECR..."
    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${VERSION}
    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

    log_info "Image pushed successfully"
}

update_task_definition() {
    log_info "Updating ECS task definition..."

    # Get current task definition
    TASK_DEFINITION=$(aws ecs describe-task-definition \
        --task-definition ${TASK_FAMILY} \
        --region ${AWS_REGION} \
        --query 'taskDefinition')

    # Update image in task definition
    NEW_TASK_DEF=$(echo ${TASK_DEFINITION} | jq --arg IMAGE "${ECR_REGISTRY}/${ECR_REPOSITORY}:${VERSION}" \
        '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')

    # Register new task definition
    NEW_TASK_ARN=$(aws ecs register-task-definition \
        --region ${AWS_REGION} \
        --cli-input-json "${NEW_TASK_DEF}" \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)

    log_info "New task definition registered: ${NEW_TASK_ARN}"
}

deploy_to_ecs() {
    log_info "Deploying to ECS..."

    # Update service with new task definition
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --task-definition ${NEW_TASK_ARN} \
        --force-new-deployment \
        --region ${AWS_REGION}

    log_info "Deployment initiated"

    # Wait for service to stabilize
    log_info "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION}

    log_info "Service stabilized"
}

run_migrations() {
    log_info "Running database migrations..."

    # Get subnet and security group IDs
    SUBNET_IDS=$(aws ec2 describe-subnets \
        --filters "Name=tag:Environment,Values=${ENVIRONMENT}" \
        --query 'Subnets[*].SubnetId' \
        --output text | tr '\t' ',')

    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --filters "Name=tag:Environment,Values=${ENVIRONMENT}" "Name=tag:Name,Values=pink-blueberry-sg" \
        --query 'SecurityGroups[0].GroupId' \
        --output text)

    # Run migration task
    TASK_ARN=$(aws ecs run-task \
        --cluster ${ECS_CLUSTER} \
        --task-definition pink-blueberry-migration-task \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_IDS}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
        --region ${AWS_REGION} \
        --query 'tasks[0].taskArn' \
        --output text)

    log_info "Migration task started: ${TASK_ARN}"

    # Wait for migration to complete
    aws ecs wait tasks-stopped \
        --cluster ${ECS_CLUSTER} \
        --tasks ${TASK_ARN} \
        --region ${AWS_REGION}

    # Check migration task exit code
    EXIT_CODE=$(aws ecs describe-tasks \
        --cluster ${ECS_CLUSTER} \
        --tasks ${TASK_ARN} \
        --region ${AWS_REGION} \
        --query 'tasks[0].containers[0].exitCode' \
        --output text)

    if [ "${EXIT_CODE}" != "0" ]; then
        log_error "Migration failed with exit code: ${EXIT_CODE}"
        exit 1
    fi

    log_info "Migrations completed successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Get load balancer URL
    if [ "${ENVIRONMENT}" == "production" ]; then
        HEALTH_URL="https://pink-blueberry.com/api/health"
    else
        HEALTH_URL="https://${ENVIRONMENT}.pink-blueberry.com/api/health"
    fi

    # Check health endpoint
    MAX_RETRIES=30
    RETRY_COUNT=0

    while [ ${RETRY_COUNT} -lt ${MAX_RETRIES} ]; do
        if curl -f ${HEALTH_URL} &> /dev/null; then
            log_info "Health check passed"
            break
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_warn "Health check failed, retrying... (${RETRY_COUNT}/${MAX_RETRIES})"
        sleep 10
    done

    if [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; then
        log_error "Health check failed after ${MAX_RETRIES} attempts"
        exit 1
    fi
}

invalidate_cloudfront() {
    if [ "${ENVIRONMENT}" == "production" ]; then
        log_info "Invalidating CloudFront cache..."

        DISTRIBUTION_ID=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Aliases.Items[?contains(@, 'pink-blueberry.com')]].Id" \
            --output text)

        if [ -n "${DISTRIBUTION_ID}" ]; then
            aws cloudfront create-invalidation \
                --distribution-id ${DISTRIBUTION_ID} \
                --paths "/*"

            log_info "CloudFront invalidation created"
        else
            log_warn "CloudFront distribution not found"
        fi
    fi
}

rollback() {
    log_error "Deployment failed, initiating rollback..."

    # Get previous task definition
    PREVIOUS_TASK_DEF=$(aws ecs describe-services \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION} \
        --query 'services[0].deployments[1].taskDefinition' \
        --output text)

    if [ "${PREVIOUS_TASK_DEF}" != "None" ] && [ -n "${PREVIOUS_TASK_DEF}" ]; then
        aws ecs update-service \
            --cluster ${ECS_CLUSTER} \
            --service ${ECS_SERVICE} \
            --task-definition ${PREVIOUS_TASK_DEF} \
            --force-new-deployment \
            --region ${AWS_REGION}

        log_info "Rolled back to: ${PREVIOUS_TASK_DEF}"

        # Wait for rollback to stabilize
        aws ecs wait services-stable \
            --cluster ${ECS_CLUSTER} \
            --services ${ECS_SERVICE} \
            --region ${AWS_REGION}

        log_info "Rollback completed"
    else
        log_error "No previous deployment found for rollback"
    fi
}

# Main deployment flow
main() {
    log_info "Starting deployment to ${ENVIRONMENT} with version ${VERSION}"

    # Trap errors and rollback
    trap rollback ERR

    # Check requirements
    check_requirements

    # Build and push Docker image
    build_and_push_image

    # Update task definition
    update_task_definition

    # Run database migrations
    run_migrations

    # Deploy to ECS
    deploy_to_ecs

    # Verify deployment
    verify_deployment

    # Invalidate CloudFront (production only)
    invalidate_cloudfront

    log_info "Deployment completed successfully! 🎉"
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Version: ${VERSION}"

    if [ "${ENVIRONMENT}" == "production" ]; then
        log_info "URL: https://pink-blueberry.com"
    else
        log_info "URL: https://${ENVIRONMENT}.pink-blueberry.com"
    fi
}

# Run main function
main