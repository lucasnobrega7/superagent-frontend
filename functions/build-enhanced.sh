#!/bin/bash

# Build script for enhanced Firebase Functions
set -e

echo "===== Building Enhanced Firebase Functions ====="

# Build TypeScript
echo "Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "Error: Build failed. Fix TypeScript errors before proceeding."
  exit 1
fi

# Run enhanced tests
echo "Running enhanced tests..."
npx jest src/enhanced/tests --passWithNoTests

if [ $? -ne 0 ]; then
  echo "Error: Tests failed. Fix test issues before proceeding."
  exit 1
fi

# Create enhanced deployment package
echo "Creating enhanced deployment package..."

# Create a directory for the enhanced package
mkdir -p dist/enhanced

# Copy built files
cp -r lib/* dist/enhanced/

# Copy package.json and update it
cp package.json dist/enhanced/
node -e "
  const pkg = require('./dist/enhanced/package.json');
  pkg.name = 'enhanced-functions';
  pkg.version = '1.0.0';
  pkg.description = 'Enhanced Firebase Functions with Zod, Sentry, and OpenAPI';
  pkg.main = 'index.js';
  require('fs').writeFileSync('./dist/enhanced/package.json', JSON.stringify(pkg, null, 2));
"

# Copy .env files
cp .env.production dist/enhanced/ 2>/dev/null || :

# Generate API docs
echo "Generating API documentation..."
mkdir -p dist/enhanced/docs

# Include the enhanced implementation documentation
cp ENHANCED_IMPLEMENTATION.md dist/enhanced/docs/

echo "===== Enhanced build complete ====="
echo "The enhanced package is available in dist/enhanced/"
echo "To deploy, run: firebase deploy --only functions:enhanced"