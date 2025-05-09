#!/bin/bash

# Script to set up Sentry in your Firebase Functions project
set -e

echo "===== Setting up Sentry for error tracking ====="

# Check if SENTRY_DSN already exists in .env.production
if grep -q "SENTRY_DSN" .env.production; then
  echo "SENTRY_DSN already exists in .env.production"
else
  # Prompt for Sentry DSN
  read -p "Enter your Sentry DSN (leave blank to skip): " SENTRY_DSN
  
  if [ -n "$SENTRY_DSN" ]; then
    # Add to .env.production
    echo "" >> .env.production
    echo "# Sentry configuration" >> .env.production
    echo "SENTRY_DSN=$SENTRY_DSN" >> .env.production
    echo "Added SENTRY_DSN to .env.production"
  else
    echo "Skipping Sentry DSN configuration"
  fi
fi

# Update the Sentry release value
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version || '1.0.0')")
echo "Current project version: $CURRENT_VERSION"

# Check if SENTRY_RELEASE already exists in .env.production
if grep -q "SENTRY_RELEASE" .env.production; then
  # Update the existing SENTRY_RELEASE value
  sed -i.bak "s/SENTRY_RELEASE=.*/SENTRY_RELEASE=$CURRENT_VERSION/" .env.production
  echo "Updated SENTRY_RELEASE to $CURRENT_VERSION in .env.production"
  rm -f .env.production.bak
else
  # Add SENTRY_RELEASE to .env.production
  echo "SENTRY_RELEASE=$CURRENT_VERSION" >> .env.production
  echo "Added SENTRY_RELEASE=$CURRENT_VERSION to .env.production"
fi

echo "===== Sentry setup complete ====="