# 🗄️ Database Setup Guide for Pink-BlueBerry Salon

## Quick Start - Choose One Option:

### Option 1: Vercel Postgres (Recommended for Production)
1. Go to: https://vercel.com/pat-carneys-projects/pink-blueberry-salon/storage
2. Click "Create Database" → Select "Postgres"
3. It will automatically add DATABASE_URL to your project
4. Pull the env vars locally: `vercel env pull .env.local`

### Option 2: Neon (Free PostgreSQL)
1. Sign up at https://neon.tech
2. Create a new database
3. Copy the connection string
4. Add to Vercel: https://vercel.com/pat-carneys-projects/pink-blueberry-salon/settings/environment-variables

### Option 3: Supabase (Free PostgreSQL)
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use the "Transaction" mode URL)
5. Add to Vercel environment variables

## Required Environment Variables

Add these to Vercel Dashboard:
```
DATABASE_URL=<your-postgres-connection-string>
NEXTAUTH_SECRET=kEQlGzPbdIHUJXAmgcZ71aansvGBOr3dg6RFLrTwKcY=
NEXTAUTH_URL=https://pink-blueberry-salon.vercel.app
```

## After Database Setup

1. Pull environment variables locally:
```bash
vercel env pull .env.local
```

2. Run migrations:
```bash
npx prisma migrate deploy
```

3. Seed the database:
```bash
npx prisma db seed
```

4. Redeploy to Vercel:
```bash
vercel --prod
```

## Test Credentials

After seeding, you can login with:
- **Admin**: admin@pinkblueberrysalon.com / admin123
- **Staff**: sarah@pinkblueberrysalon.com / staff123

## Troubleshooting

If you see database connection errors:
1. Ensure your database is accessible from Vercel's servers
2. Check that SSL is enabled (most providers require it)
3. Verify the connection string format
4. Make sure to redeploy after adding environment variables

## Local Development

For local development without setting up PostgreSQL:
1. Use the Docker Compose file provided
2. Run: `docker-compose up -d postgres`
3. Update .env with: `DATABASE_URL="postgresql://admin:password@localhost:5432/pinkblueberry"`