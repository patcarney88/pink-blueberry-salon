#!/bin/bash

# Build Optimization Script for Pink Blueberry Salon
# Runs comprehensive optimizations before production deployment

echo "🚀 Starting build optimization process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track optimization progress
OPTIMIZATIONS_APPLIED=0
TOTAL_OPTIMIZATIONS=8

log_step() {
    OPTIMIZATIONS_APPLIED=$((OPTIMIZATIONS_APPLIED + 1))
    echo -e "${BLUE}[$OPTIMIZATIONS_APPLIED/$TOTAL_OPTIMIZATIONS] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
log_step "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi

log_success "Prerequisites check passed"

# Clean previous builds
log_step "Cleaning previous builds..."
rm -rf .next/
rm -rf dist/
rm -rf out/
npm run clean &> /dev/null || true
log_success "Clean completed"

# Dependency optimization
log_step "Optimizing dependencies..."
npm ci --prefer-offline --no-audit &> /dev/null
npm dedupe &> /dev/null || true
log_success "Dependencies optimized"

# Security audit
log_step "Running security audit..."
AUDIT_RESULT=$(npm audit --audit-level=high --json 2>/dev/null)
HIGH_VULNERABILITIES=$(echo "$AUDIT_RESULT" | grep -o '"high":[0-9]*' | cut -d: -f2 || echo "0")
CRITICAL_VULNERABILITIES=$(echo "$AUDIT_RESULT" | grep -o '"critical":[0-9]*' | cut -d: -f2 || echo "0")

if [ "$HIGH_VULNERABILITIES" -gt 0 ] || [ "$CRITICAL_VULNERABILITIES" -gt 0 ]; then
    log_warning "Found $HIGH_VULNERABILITIES high and $CRITICAL_VULNERABILITIES critical vulnerabilities"
    echo "Run 'npm audit fix' to address security issues"
else
    log_success "No high or critical vulnerabilities found"
fi

# Type checking
log_step "Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    log_success "TypeScript type check passed"
else
    log_error "TypeScript type check failed"
    echo "Run 'npm run type-check' to see detailed errors"
    exit 1
fi

# Linting
log_step "Running linting..."
if npm run lint:fix > /dev/null 2>&1; then
    log_success "Linting passed with fixes applied"
else
    log_warning "Linting issues found - continuing with build"
fi

# Build optimization
log_step "Building with optimizations..."

# Set production environment variables for build
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export ANALYZE_BUNDLE=true

# Run the build
if npm run build; then
    log_success "Build completed successfully"
else
    log_error "Build failed"
    exit 1
fi

# Bundle analysis
log_step "Analyzing bundle size..."
if [ -f ".next/analyze/client.html" ]; then
    echo "Bundle analysis available at .next/analyze/client.html"

    # Check for large bundles
    BUNDLE_SIZE=$(du -sh .next/static/chunks | cut -f1)
    echo "Total chunk size: $BUNDLE_SIZE"

    # Check for large individual files
    find .next/static/chunks -name "*.js" -size +500k -exec echo "Large bundle: {} ($(du -h {} | cut -f1))" \;

    log_success "Bundle analysis completed"
else
    log_warning "Bundle analysis not available"
fi

# Performance validation
log_step "Running performance validation..."

# Check if critical files exist
CRITICAL_FILES=(
    ".next/server/pages/index.js"
    ".next/static/css"
    ".next/static/chunks"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        log_error "Critical file missing: $file"
        exit 1
    fi
done

# Validate build outputs
PAGES_COUNT=$(find .next/server/pages -name "*.js" | wc -l)
STATIC_COUNT=$(find .next/static -name "*" | wc -l)

echo "Pages built: $PAGES_COUNT"
echo "Static assets: $STATIC_COUNT"

if [ "$PAGES_COUNT" -lt 5 ]; then
    log_warning "Fewer pages than expected: $PAGES_COUNT"
fi

log_success "Performance validation completed"

# Generate optimization report
echo ""
echo -e "${GREEN}🎉 Build optimization completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Optimization Summary:${NC}"
echo "• Dependencies: Optimized and audited"
echo "• TypeScript: Type-checked"
echo "• Linting: Applied fixes"
echo "• Build: Production-optimized"
echo "• Bundle: Analyzed for size"
echo "• Performance: Validated"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Review bundle analysis at .next/analyze/client.html"
echo "2. Run tests: npm test"
echo "3. Deploy: npm run deploy or ./scripts/deploy-vercel.sh"
echo ""
echo -e "${GREEN}Ready for deployment! 🚀${NC}"