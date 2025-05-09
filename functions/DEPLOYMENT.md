# Deploying Firebase Functions to Vercel

This guide provides instructions for deploying the Firebase Functions for the Superagent project.

## Prerequisites

- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Vercel CLI installed (`npm install -g vercel`)
- Firebase account with Functions enabled
- Vercel account

## Environment Setup

1. Make sure all required environment variables are set in `.env.production`:
   - `SUPERAGENT_API_KEY` - Your Superagent API key
   - `LITERALAI_API_KEY` - Your LiteralAI API key
   - `FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket name

2. Make sure your Firebase project is properly configured:
   ```bash
   firebase login
   firebase use <your-project-id>
   ```

## Build and Deploy

### Option 1: Using the deployment script

1. Run the deployment script:
   ```bash
   ./deploy-to-vercel.sh
   ```

### Option 2: Manual Deployment

1. Build the TypeScript files:
   ```bash
   npm run build
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Verifying Deployment

After deployment, verify that your Firebase Functions are working correctly:

1. Test the healthCheck endpoint:
   ```bash
   curl https://<your-vercel-domain>/healthCheck
   ```

2. Test the status check function:
   ```bash
   curl https://<your-vercel-domain>/getSuperagentStatus
   ```

## Troubleshooting

### Common Issues

1. **TypeScript Build Errors**
   - Make sure all TypeScript errors are fixed before deploying
   - Check for type inconsistencies in function parameters

2. **Environment Variables Not Available**
   - Verify that all required environment variables are configured in Vercel's dashboard
   - Check the `.env.production` file for missing variables

3. **CORS Issues**
   - Ensure the `cors-handler.ts` file has the correct domains listed
   - Test your API endpoints with the appropriate Origin header

4. **Firebase Connection Issues**
   - Verify Firebase credentials are properly set up in Vercel
   - Check that service account permissions are correctly configured

## Connecting the Frontend

The Next.js frontend should be configured to connect to the Firebase Functions. 
This is handled by the rewrite rules in the main `vercel.json` file:

```json
"rewrites": [
  {
    "source": "/api/firebase/:path*",
    "destination": "https://us-central1-agentesdeconversao.cloudfunctions.net/:path*"
  }
]
```

This configuration ensures all requests to `/api/firebase/*` are forwarded to your Firebase Functions.