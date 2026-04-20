#!/bin/bash
# Run this script in Replit after pulling updates: bash update.sh

set -e

echo "📥 Fetching latest changes..."
git fetch origin claude/tiblogics-website-build-ZCs63
git reset --hard origin/claude/tiblogics-website-build-ZCs63

echo "📦 Installing dependencies..."
npm install

echo "🗄️  Generating Prisma client..."
npx prisma generate

echo "✅ Done! Preview should now load correctly."
echo "   If this is a fresh setup, also run: npx prisma db push"
