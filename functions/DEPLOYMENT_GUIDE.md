# Deployment Guide

## Prerequisites

- Node.js 18 (specific version required by Firebase Functions)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project configured

## Environment Setup

### 1. Sentry Configuration

Set up Sentry DSN for error tracking:

```bash
# Run the Sentry setup script
./setup-sentry.sh

# Or manually set the environment variable
export SENTRY_DSN="your-sentry-dsn"
```

### 2. Local Development

```bash
# Install dependencies
npm install

# Build the functions
npm run build

# Run Firebase emulator for local testing
npm run serve

# Access API documentation
# Visit: http://localhost:5001/YOUR-PROJECT-ID/us-central1/apiDocs
```

### 3. Testing

```bash
# Run tests
npm run test

# Check for TypeScript errors
npm run build
```

## Deployment Steps

### 1. Build for Production

```bash
# Build TypeScript code
npm run build
```

### 2. Set Environment Variables

Make sure to set these environment variables in Firebase:

```bash
# For Sentry integration
firebase functions:config:set sentry.dsn="your-sentry-dsn"
firebase functions:config:set sentry.environment="production"

# For other services if needed
firebase functions:config:set superagent.api_key="your-api-key"
```

### 3. Deploy to Firebase

```bash
# Deploy all functions
npm run deploy

# Or deploy specific functions
firebase deploy --only functions:functionName1,functions:functionName2
```

### 4. Verify Deployment

1. Check Firebase Console for successful deployment
2. Verify API documentation at: `https://YOUR-REGION-YOUR-PROJECT-ID.cloudfunctions.net/apiDocs`
3. Test the health check endpoint: `https://YOUR-REGION-YOUR-PROJECT-ID.cloudfunctions.net/simpleEnhancedHealthCheck`

## Troubleshooting

### Common Issues

1. **Node Version Mismatch**:
   - Ensure you're using Node.js 18 (the version specified in package.json)
   - Use nvm to switch versions: `nvm use 18`

2. **TypeScript Errors**:
   - Run `npm run build` to see detailed errors
   - Fix type issues in the code

3. **Sentry Not Initializing**:
   - Check if SENTRY_DSN is correctly set
   - Verify Sentry initialization in logs

4. **Firebase Functions Permissions**:
   - Ensure proper IAM roles are assigned
   - Check Firebase Console for error logs

## Monitoring

- Check Sentry dashboard for error tracking
- Use Firebase Functions logs: `npm run logs`
- Monitor function performance in Firebase Console

## Rollback Procedure

If needed, revert to a previous version:

```bash
# List previous deployments
firebase hosting:versions:list

# Rollback to a specific version
firebase hosting:clone [SOURCE_SITE_ID]:[VERSION] [DESTINATION_SITE_ID]:[DESTINATION_VERSION]
```