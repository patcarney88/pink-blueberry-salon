#!/bin/bash

# Pink Blueberry Salon Rollback Script
# Usage: ./scripts/rollback.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-us-east-1}
ECS_CLUSTER="pink-blueberry-cluster-${ENVIRONMENT}"
ECS_SERVICE="pink-blueberry-service-${ENVIRONMENT}"

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

get_deployment_history() {
    log_info "Getting deployment history..."

    aws ecs describe-services \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION} \
        --query 'services[0].deployments[*].[taskDefinition,status,createdAt]' \
        --output table
}

rollback_to_previous() {
    log_info "Rolling back to previous deployment..."

    # Get current and previous task definitions
    DEPLOYMENTS=$(aws ecs describe-services \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION} \
        --query 'services[0].deployments[*].taskDefinition' \
        --output text)

    CURRENT_TASK_DEF=$(echo ${DEPLOYMENTS} | awk '{print $1}')
    PREVIOUS_TASK_DEF=$(echo ${DEPLOYMENTS} | awk '{print $2}')

    if [ -z "${PREVIOUS_TASK_DEF}" ] || [ "${PREVIOUS_TASK_DEF}" == "None" ]; then
        log_error "No previous deployment found"
        exit 1
    fi

    log_info "Current task definition: ${CURRENT_TASK_DEF}"
    log_info "Rolling back to: ${PREVIOUS_TASK_DEF}"

    # Confirm rollback
    read -p "Are you sure you want to rollback? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    # Perform rollback
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --task-definition ${PREVIOUS_TASK_DEF} \
        --force-new-deployment \
        --region ${AWS_REGION}

    log_info "Rollback initiated"

    # Wait for service to stabilize
    log_info "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION}

    log_info "Service stabilized"

    # Verify rollback
    verify_rollback
}

rollback_to_specific() {
    TASK_DEF_ARN=$1

    if [ -z "${TASK_DEF_ARN}" ]; then
        log_error "Task definition ARN is required"
        exit 1
    fi

    log_info "Rolling back to specific task definition: ${TASK_DEF_ARN}"

    # Confirm rollback
    read -p "Are you sure you want to rollback to ${TASK_DEF_ARN}? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    # Perform rollback
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --task-definition ${TASK_DEF_ARN} \
        --force-new-deployment \
        --region ${AWS_REGION}

    log_info "Rollback initiated"

    # Wait for service to stabilize
    log_info "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION}

    log_info "Service stabilized"

    # Verify rollback
    verify_rollback
}

verify_rollback() {
    log_info "Verifying rollback..."

    # Get health check URL
    if [ "${ENVIRONMENT}" == "production" ]; then
        HEALTH_URL="https://pink-blueberry.com/api/health"
    else
        HEALTH_URL="https://${ENVIRONMENT}.pink-blueberry.com/api/health"
    fi

    # Check health endpoint
    if curl -f ${HEALTH_URL} &> /dev/null; then
        log_info "Health check passed"
        log_info "Rollback completed successfully! ✅"
    else
        log_error "Health check failed after rollback"
        exit 1
    fi
}

# Main function
main() {
    log_info "Pink Blueberry Salon Rollback Script"
    log_info "Environment: ${ENVIRONMENT}"

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

    # Show deployment history
    get_deployment_history

    # Check if specific task definition was provided
    if [ -n "$2" ]; then
        rollback_to_specific $2
    else
        rollback_to_previous
    fi
}

# Run main function
main $@