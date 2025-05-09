#!/bin/bash

# Script to test Firebase Functions after deployment
# This will perform simple tests to verify functionality

BASE_URL="http://localhost:5001/sabrinaai-2a39e/us-central1"

echo "===== Testing Firebase Functions ====="

# Test health check endpoint
echo "Testing health check..."
curl -s "${BASE_URL}/healthCheck" | grep -q "healthy"
if [ $? -eq 0 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
fi

# Test debug info
echo "Testing debug info..."
curl -s -X POST "${BASE_URL}/debugInfo" \
  -H "Content-Type: application/json" \
  -d '{}' | grep -q "message"
if [ $? -eq 0 ]; then
  echo "✅ Debug info passed"
else
  echo "❌ Debug info failed"
fi

# Test Superagent status
echo "Testing Superagent status..."
curl -s -X POST "${BASE_URL}/getSuperagentStatus" \
  -H "Content-Type: application/json" \
  -d '{}' | grep -q "success"
if [ $? -eq 0 ]; then
  echo "✅ Superagent status passed"
else
  echo "❌ Superagent status failed"
fi

echo "===== Testing complete ====="
echo "Note: Some tests may fail if authentication is required."
echo "For a complete test, use the Firebase console or authenticated requests."