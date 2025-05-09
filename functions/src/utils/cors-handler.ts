/**
 * CORS Handler for Superagent API
 * Provides utilities for handling CORS in API requests
 */
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import { logger } from 'firebase-functions';

// Cache for allowed origins
let cachedAllowedOrigins: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches allowed origins from Firestore
 */
async function fetchAllowedOrigins(): Promise<string[]> {
  try {
    // Check if cache is valid
    const now = Date.now();
    if (cachedAllowedOrigins && now - cacheTimestamp < CACHE_TTL) {
      return cachedAllowedOrigins;
    }
    
    // Initialize Firestore if needed
    const db = admin.firestore();
    
    // Fetch allowed origins from Firestore config collection
    const configDoc = await db.collection('config').doc('cors').get();
    
    if (!configDoc.exists) {
      // Create default config if it doesn't exist
      const defaultOrigins = [
        'https://agentesdeconversao.com.br',
        'https://www.agentesdeconversao.com.br',
        'http://localhost:3000'
      ];
      
      await db.collection('config').doc('cors').set({
        allowedOrigins: defaultOrigins,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      cachedAllowedOrigins = defaultOrigins;
    } else {
      // Get allowed origins from config
      const data = configDoc.data();
      const allowedOrigins = data?.allowedOrigins || [];
      cachedAllowedOrigins = allowedOrigins;
    }
    
    // Update cache timestamp
    cacheTimestamp = now;
    
    return cachedAllowedOrigins;
  } catch (error) {
    logger.error('Error fetching allowed origins:', error);
    
    // Return default origins in case of error
    return [
      'https://agentesdeconversao.com.br',
      'https://www.agentesdeconversao.com.br',
      'http://localhost:3000'
    ];
  }
}

/**
 * Creates a CORS middleware that dynamically fetches allowed origins
 */
export async function createCorsMiddleware() {
  const allowedOrigins = await fetchAllowedOrigins();
  
  // Create CORS options
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  
  return cors.default(corsOptions);
}

/**
 * Middleware for checking origin in HTTP functions
 */
export function checkOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true; // Allow requests with no origin
  }
  
  // Use cached origins if available
  if (cachedAllowedOrigins) {
    return cachedAllowedOrigins.indexOf(origin) !== -1;
  }
  
  // If no cache, allow these default origins
  const defaultOrigins = [
    'https://agentesdeconversao.com.br',
    'https://www.agentesdeconversao.com.br',
    'http://localhost:3000'
  ];
  
  return defaultOrigins.indexOf(origin) !== -1;
}