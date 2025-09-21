#!/bin/bash

echo "🚀 Pink-BlueBerry Salon Database Setup Script"
echo "============================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found. Please set up Vercel Postgres first."
    echo "Visit: https://vercel.com/pat-carneys-projects/pink-blueberry-salon/storage"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Generate NEXTAUTH_SECRET if not exists
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚙️ Generating NEXTAUTH_SECRET..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.local
    echo "✅ NEXTAUTH_SECRET generated and saved"
fi

# Set NEXTAUTH_URL if not exists
if [ -z "$NEXTAUTH_URL" ]; then
    echo "NEXTAUTH_URL=https://pink-blueberry-salon.vercel.app" >> .env.local
    echo "✅ NEXTAUTH_URL set"
fi

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed the database
echo "🌱 Seeding database with demo data..."
npx prisma db seed

echo "✨ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Push environment variables to Vercel:"
echo "   vercel env add NEXTAUTH_SECRET production < .env.local"
echo "2. Redeploy the application:"
echo "   vercel --prod"