# 🚀 Deployment Guide - The Pink Blueberry Salon

> Complete deployment documentation for production environments

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Vercel Deployment](#vercel-deployment)
- [GitHub Setup](#github-setup)
- [Environment Configuration](#environment-configuration)
- [Custom Domain](#custom-domain)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Analytics](#monitoring--analytics)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 🎯 One-Command Deploy
```bash
# Deploy to Vercel (production)
vercel --prod

# Deploy to preview
vercel
```

### 📍 Current Deployment
- **Production URL**: https://pink-blueberry-salon.vercel.app
- **GitHub Repository**: https://github.com/yourusername/pink-blueberry-salon
- **Status**: ✅ Live

## Prerequisites

### Required Tools
```bash
# Node.js (18.x or higher)
node --version

# npm or yarn
npm --version

# Git
git --version

# Vercel CLI (optional but recommended)
npm install -g vercel
```

### Account Requirements
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Domain name (optional)

## Vercel Deployment

### Method 1: Vercel Dashboard (Recommended)

1. **Import Project**
   ```
   1. Go to https://vercel.com/new
   2. Click "Import Git Repository"
   3. Select your GitHub repository
   4. Configure project:
      - Framework Preset: Next.js
      - Root Directory: ./
      - Build Command: npm run build
      - Output Directory: .next
   ```

2. **Environment Variables**
   ```
   Add in Vercel Dashboard → Settings → Environment Variables:

   NEXT_PUBLIC_API_URL=https://api.pinkblueberrysalon.com
   NEXT_PUBLIC_SITE_URL=https://pink-blueberry-salon.vercel.app
   ```

3. **Deploy**
   ```
   Click "Deploy" and wait for build completion
   ```

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Project**
   ```bash
   # First deployment
   vercel

   # Follow prompts:
   # - Set up and deploy: Y
   # - Which scope: Select your account
   # - Link to existing project: N
   # - Project name: pink-blueberry-salon
   # - Directory: ./
   # - Build Command: default
   # - Output Directory: default
   # - Development Command: default
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Method 3: Git Integration

1. **Connect GitHub to Vercel**
   ```
   1. Push code to GitHub main branch
   2. Vercel auto-deploys on push
   3. Preview deployments for pull requests
   ```

2. **Branch Configuration**
   ```
   main branch → Production
   develop branch → Preview
   feature/* → Preview
   ```

## GitHub Setup

### Repository Configuration

1. **Create Repository**
   ```bash
   # Initialize git (if not already)
   git init

   # Add remote
   git remote add origin https://github.com/yourusername/pink-blueberry-salon.git

   # Create main branch
   git branch -M main
   ```

2. **Initial Push**
   ```bash
   # Add all files
   git add .

   # Commit
   git commit -m "feat: Initial deployment of Pink Blueberry Salon

   - Complete hackathon submission
   - AI Beauty Advisor implementation
   - AR Virtual Try-On feature
   - Gamified Loyalty System

   🤖 Generated with Claude Code"

   # Push to GitHub
   git push -u origin main
   ```

3. **Branch Protection**
   ```
   Settings → Branches → Add rule:
   - Branch name pattern: main
   - ✅ Require pull request reviews
   - ✅ Dismiss stale reviews
   - ✅ Require status checks
   ```

## Environment Configuration

### Development (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# External Services (if needed)
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...

# Analytics (optional)
NEXT_PUBLIC_GA_ID=GA-...
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

### Production (.env.production)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.pinkblueberrysalon.com
NEXT_PUBLIC_SITE_URL=https://pinkblueberrysalon.com

# External Services
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...

# Analytics
NEXT_PUBLIC_GA_ID=GA-...
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
```

### Security Best Practices
- Never commit `.env` files to git
- Use Vercel's environment variable UI
- Rotate keys regularly
- Use different keys for dev/staging/production

## Custom Domain

### Domain Configuration

1. **Add Domain in Vercel**
   ```
   Dashboard → Settings → Domains → Add
   Enter: pinkblueberrysalon.com
   ```

2. **DNS Configuration**
   ```
   Add these records to your DNS provider:

   Type  Name    Value
   A     @       76.76.21.21
   CNAME www     cname.vercel-dns.com
   ```

3. **SSL Certificate**
   ```
   Automatic SSL provisioning via Let's Encrypt
   No configuration needed
   ```

### Subdomain Setup
```
api.pinkblueberrysalon.com → API Gateway
app.pinkblueberrysalon.com → Main Application
admin.pinkblueberrysalon.com → Admin Panel
```

## Performance Optimization

### Build Optimization

1. **Next.js Configuration**
   ```javascript
   // next.config.ts
   module.exports = {
     swcMinify: true,
     compress: true,
     poweredByHeader: false,

     images: {
       domains: ['pinkblueberrysalon.com'],
       formats: ['image/avif', 'image/webp'],
     },

     experimental: {
       optimizeCss: true,
       optimizePackageImports: ['framer-motion'],
     },
   }
   ```

2. **Bundle Analysis**
   ```bash
   # Analyze bundle size
   npm run analyze

   # Check for large dependencies
   npx bundle-buddy
   ```

### Caching Strategy

1. **Static Assets**
   ```javascript
   // Headers in next.config.ts
   async headers() {
     return [
       {
         source: '/static/:path*',
         headers: [
           {
             key: 'Cache-Control',
             value: 'public, max-age=31536000, immutable',
           },
         ],
       },
     ]
   }
   ```

2. **API Caching**
   ```javascript
   // API route caching
   export const revalidate = 60 // seconds
   ```

### Edge Functions
```javascript
// Use Edge Runtime for better performance
export const runtime = 'edge'
```

## Monitoring & Analytics

### Vercel Analytics

1. **Enable Analytics**
   ```bash
   npm install @vercel/analytics
   ```

2. **Add to Layout**
   ```typescript
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <>
         {children}
         <Analytics />
       </>
     )
   }
   ```

### Speed Insights

1. **Enable Speed Insights**
   ```bash
   npm install @vercel/speed-insights
   ```

2. **Implementation**
   ```typescript
   import { SpeedInsights } from '@vercel/speed-insights/next'

   <SpeedInsights />
   ```

### External Monitoring
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: APM monitoring
- **New Relic**: Performance monitoring

## CI/CD Pipeline

### GitHub Actions

1. **Basic Pipeline**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Production

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest

       steps:
         - uses: actions/checkout@v3

         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'

         - name: Install dependencies
           run: npm ci

         - name: Run tests
           run: npm test

         - name: Build
           run: npm run build

         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.ORG_ID }}
             vercel-project-id: ${{ secrets.PROJECT_ID }}
             vercel-args: '--prod'
   ```

2. **Preview Deployments**
   ```yaml
   # For pull requests
   name: Preview Deployment

   on:
     pull_request:
       types: [opened, synchronize]

   jobs:
     preview:
       runs-on: ubuntu-latest
       steps:
         # Similar steps but without --prod flag
   ```

### Pre-deployment Checks

```bash
# Run before deploying
npm run preflight

# Includes:
# - Type checking
# - Linting
# - Tests
# - Build verification
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Environment Variables Not Loading
```bash
# Verify variables in Vercel
vercel env pull

# Check local env file
cat .env.local
```

#### 404 Errors After Deployment
```javascript
// Check next.config.ts
module.exports = {
  trailingSlash: true, // May be needed
}
```

#### Large Bundle Size
```bash
# Analyze bundle
npm run analyze

# Common solutions:
# - Dynamic imports
# - Tree shaking
# - Remove unused dependencies
```

### Debug Mode

1. **Enable Debug Logs**
   ```env
   DEBUG=* vercel
   ```

2. **Verbose Output**
   ```bash
   vercel --debug
   ```

### Rollback Deployment

1. **Via Dashboard**
   ```
   Deployments → Select Previous → Promote to Production
   ```

2. **Via CLI**
   ```bash
   vercel rollback
   ```

## Production Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] API endpoints updated
- [ ] Database migrations complete
- [ ] Security headers configured
- [ ] Error tracking enabled
- [ ] Analytics configured

### Post-Deployment
- [ ] Verify all pages load
- [ ] Test critical user paths
- [ ] Check mobile responsiveness
- [ ] Verify API connections
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Test payment flows
- [ ] Verify email notifications

## Maintenance

### Regular Tasks
- **Weekly**: Review error logs
- **Monthly**: Update dependencies
- **Quarterly**: Security audit
- **Yearly**: Major version upgrades

### Backup Strategy
```bash
# Backup database
pg_dump production_db > backup.sql

# Backup environment
vercel env pull .env.backup

# Code backup (via Git)
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

## Support

### Resources
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **GitHub**: https://github.com/yourusername/pink-blueberry-salon
- **Support Email**: dev@pinkblueberrysalon.com

### Emergency Contacts
- **DevOps Lead**: devops@pinkblueberrysalon.com
- **Vercel Support**: https://vercel.com/support
- **Status Page**: https://status.pinkblueberrysalon.com

---

<div align="center">
  <strong>Deployment Documentation</strong><br>
  The Pink Blueberry Salon<br>
  <em>Deploy with Confidence</em>
</div>