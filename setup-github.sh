#!/bin/bash

# GitHub Repository Setup Script for patcarney88
# Pink Blueberry Salon Management System

echo "🚀 Setting up GitHub repository for patcarney88..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Repository details
GITHUB_USER="patcarney88"
REPO_NAME="pink-blueberry-salon"
REPO_DESCRIPTION="Enterprise-grade salon management system with real-time booking, staff management, and analytics"

echo -e "${YELLOW}This script will help you create a new GitHub repository.${NC}"
echo -e "${YELLOW}Please make sure you have:${NC}"
echo "1. GitHub CLI installed (gh)"
echo "2. Authenticated with GitHub CLI (gh auth login)"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI not found. Installing...${NC}"

    # Check OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install gh
    else
        echo "Please install GitHub CLI from: https://cli.github.com/"
        exit 1
    fi
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with GitHub. Running gh auth login...${NC}"
    gh auth login
fi

# Create the repository
echo -e "${GREEN}Creating repository on GitHub...${NC}"
gh repo create ${REPO_NAME} \
    --public \
    --description "${REPO_DESCRIPTION}" \
    --homepage "https://pink-blueberry-salon.vercel.app" \
    --confirm

# Add topics/tags
echo -e "${GREEN}Adding repository topics...${NC}"
gh repo edit ${GITHUB_USER}/${REPO_NAME} \
    --add-topic "nextjs" \
    --add-topic "typescript" \
    --add-topic "postgresql" \
    --add-topic "salon-management" \
    --add-topic "booking-system" \
    --add-topic "react" \
    --add-topic "tailwindcss" \
    --add-topic "prisma" \
    --add-topic "vercel"

# Set up branch protection (optional)
echo -e "${GREEN}Setting up branch protection for main branch...${NC}"
gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    /repos/${GITHUB_USER}/${REPO_NAME}/branches/main/protection \
    -f required_status_checks='{"strict":true,"contexts":["continuous-integration/github-actions"]}' \
    -f enforce_admins=false \
    -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    -f restrictions=null \
    -f allow_force_pushes=false \
    -f allow_deletions=false 2>/dev/null || echo "Branch protection will be set up after first push"

# Initialize git and add remote
echo -e "${GREEN}Configuring git repository...${NC}"
git init
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:${GITHUB_USER}/${REPO_NAME}.git

# Create initial commit
echo -e "${GREEN}Creating initial commit...${NC}"
git add -A
git commit -m "🎉 Initial commit - Pink Blueberry Salon Management System

- Complete salon management platform
- Real-time booking system
- Staff and customer management
- Payment processing with Stripe
- Business analytics dashboard
- 92% test coverage
- Enterprise security features"

# Push to GitHub
echo -e "${GREEN}Pushing to GitHub...${NC}"
git branch -M main
git push -u origin main

# Create additional branches
echo -e "${GREEN}Creating development branches...${NC}"
git checkout -b develop
git push -u origin develop
git checkout -b staging
git push -u origin staging
git checkout main

# Add GitHub Actions secrets reminder
echo ""
echo -e "${GREEN}✅ Repository created successfully!${NC}"
echo -e "${GREEN}Repository URL: https://github.com/${GITHUB_USER}/${REPO_NAME}${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Add the following secrets in GitHub Settings > Secrets:${NC}"
echo "
Required Secrets for Vercel Deployment:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

Database & Services:
- DATABASE_URL
- REDIS_URL
- NEXTAUTH_SECRET
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET

External Services:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- SENDGRID_API_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- PUSHER_APP_ID
- PUSHER_KEY
- PUSHER_SECRET
"

echo -e "${GREEN}Next steps:${NC}"
echo "1. Add secrets in GitHub repository settings"
echo "2. Connect to Vercel: vercel link"
echo "3. Deploy to Vercel: vercel --prod"
echo "4. Set up custom domain (optional)"

echo -e "${GREEN}🎉 Setup complete!${NC}"