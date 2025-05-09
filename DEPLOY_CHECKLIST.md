# Deployment Checklist - Frontend to Vercel

## Pre-Deployment Checklist

- [ ] Firebase Functions deployed and working
- [ ] Environment variables configured in `.env.production`
- [ ] Firebase configuration verified in `vercel.json`
- [ ] Build successful locally with `npm run build`
- [ ] API Tests passing locally
- [ ] Firebase Tests passing locally

## Deployment Steps

1. **Option 1: Using the Automated Script**
   - [ ] Run `bash deploy-to-vercel.sh`
   - [ ] Confirm when prompted

2. **Option 2: Manual Deployment**
   - [ ] Install Vercel CLI: `npm install -g vercel`
   - [ ] Login: `vercel login`
   - [ ] Deploy: `vercel --prod`

## Post-Deployment Verification

- [ ] Application loads at the Vercel URL
- [ ] Authentication works (Clerk)
- [ ] Firebase Functions accessible at `/api-test`
- [ ] Storage integration working
- [ ] Analytics events recording properly

## Troubleshooting Common Issues

1. **Build Failures**
   - Check if Firebase SDK is causing issues
   - Verify webpack configuration in `next.config.js`
   - Ensure `undici` is properly handled

2. **Firebase Connection Issues**
   - Verify `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL` is correct
   - Check `vercel.json` rewrites configuration
   - Test API endpoints directly

3. **Auth Problems**
   - Verify Clerk keys in environment variables
   - Check if auth middleware is properly configured

## Notes

- The alternative Firebase client (`api-functions-client.ts`) should be used for all Firebase Functions calls
- Avoid using the Firebase SDK directly in client components
- Use the test pages at `/api-test` and `/firebase-test` to verify integration

For detailed deployment instructions, see [README-DEPLOY.md](./README-DEPLOY.md)