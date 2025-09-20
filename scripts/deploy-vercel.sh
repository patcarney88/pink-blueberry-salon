#!/bin/bash

# Vercel Deployment Script for Pink Blueberry Salon
# Optimized deployment with monitoring and performance optimization

echo "🚀 Starting Vercel deployment for Pink Blueberry Salon..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please log in to Vercel:${NC}"
    echo "Run: vercel login"
    echo "Then run this script again."
    exit 1
fi

# Pre-deployment optimization
echo -e "${BLUE}⚡ Running pre-deployment optimizations...${NC}"

# Build optimization
echo "Building project..."
npm run build

# Run tests to ensure quality
echo "Running tests..."
npm test -- --coverage --passWithNoTests

# Security scan
echo "Running security audit..."
npm audit --audit-level=moderate

# Link project to Vercel (if not already linked)
echo -e "${BLUE}🔗 Linking project to Vercel...${NC}"
if [ ! -d ".vercel" ]; then
    vercel link --yes
fi

# Deploy to production
echo -e "${GREEN}🚀 Deploying to production...${NC}"
vercel --prod \
  --regions iad1,sfo1,pdx1 \
  --env DATABASE_URL="$DATABASE_URL" \
  --env NEXTAUTH_URL="$NEXTAUTH_URL" \
  --env NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  --env JWT_SECRET="$JWT_SECRET" \
  --env STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  --env STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  --env SENDGRID_API_KEY="$SENDGRID_API_KEY" \
  --env PUSHER_APP_ID="$PUSHER_APP_ID" \
  --env PUSHER_KEY="$PUSHER_KEY" \
  --env PUSHER_SECRET="$PUSHER_SECRET" \
  --env REDIS_URL="$REDIS_URL" \
  --confirm

# Get deployment URL
DEPLOYMENT_URL=$(vercel --prod --confirm 2>/dev/null | grep -o 'https://[^ ]*')

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 URL: $DEPLOYMENT_URL${NC}"

    # Run post-deployment checks
    echo -e "${BLUE}🔍 Running post-deployment validation...${NC}"

    # Health check
    if curl -f "$DEPLOYMENT_URL/api/health" &> /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed - manual verification needed${NC}"
    fi

    # Performance test
    echo "Running Lighthouse performance test..."
    if command -v lighthouse &> /dev/null; then
        lighthouse "$DEPLOYMENT_URL" --output=json --output-path=./lighthouse-results.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo
        echo -e "${GREEN}📊 Lighthouse results saved to lighthouse-results.json${NC}"
    else
        echo -e "${YELLOW}⚠️  Lighthouse not installed - run 'npm install -g lighthouse' for performance testing${NC}"
    fi

    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Set up custom domain (optional): vercel domains add your-domain.com"
    echo "2. Configure monitoring: https://vercel.com/docs/analytics"
    echo "3. Set up alerts: https://vercel.com/docs/integrations/discord"
    echo "4. Review performance: https://vercel.com/docs/speed-insights"

else
    echo -e "${YELLOW}⚠️  Deployment may have failed - check Vercel dashboard${NC}"
    exit 1
fi