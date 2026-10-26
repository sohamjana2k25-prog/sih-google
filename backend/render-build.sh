#!/usr/bin/env bash
# Render.com build script for APAAR-Sentinel Backend
set -e

echo "==> Installing dependencies..."
npm install

echo "==> Compiling TypeScript..."
npm run build

echo "==> Checking if database needs seeding..."
DB_FILE="/data/apaar_sentinel.sqlite"

if [ ! -f "$DB_FILE" ]; then
  echo "==> Database not found at $DB_FILE — running seed..."
  DATABASE_PATH="$DB_FILE" node -e "
    const { initializeDatabase } = require('./dist/database/schema.js');
    initializeDatabase();
    console.log('Schema initialized.');
  "
  DATABASE_PATH="$DB_FILE" npx tsx src/database/seed.ts
  echo "==> Database seeded successfully."
else
  echo "==> Database already exists — skipping seed."
fi

echo "==> Build complete."
