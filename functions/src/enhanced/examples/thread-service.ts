/**
 * Enhanced Thread Service Example
 * 
 * This example shows how to use the enhanced tools to create a robust
 * Firebase Function for thread management.
 */
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { schemaRegistry } from '../schema-registry';
import { createFunction } from '../function-middleware';
import axios from 'axios';

// Register schemas with the registry
const CreateThreadRequestSchema = schemaRegistry.register('CreateThreadRequest', z.object({
  name: z.string().min(1, "Thread name is required"),
  metadata: z.record(z.any()).optional(),
}));

const ThreadResponseSchema = schemaRegistry.register('ThreadResponse', z.object({
  success: z.boolean(),
  threadId: z.string(),
  timestamp: z.string(),
}));

// External API client (example)
const apiClient = axios.create({
  baseURL: process.env.API_URL || 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.API_KEY || ''}`
  }
});

/**
 * Thread service implementation
 */
class ThreadService {
  /**
   * Create a new thread
   * @param name Thread name
   * @param metadata Optional metadata
   * @param userId Owner user ID
   * @returns Created thread information
   */
  async createThread(
    name: string,
    metadata: Record<string, any> = {},
    userId: string
  ): Promise<{ threadId: string }> {
    try {
      // Call external API to create thread
      const response = await apiClient.post('/threads', {
        name,
        metadata: {
          ...metadata,
          userId,
          createdAt: new Date().toISOString()
        }
      });
      
      return { threadId: response.data.id };
    } catch (error) {
      // Throw specific error types based on the error
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new functions.https.HttpsError(
            'unauthenticated',
            'API authentication failed'
          );
        }
        
        if (error.response?.status === 400) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid thread data',
            error.response.data
          );
        }
        
        if (error.response?.status === 429) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'API rate limit exceeded'
          );
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  }
}

// Singleton instance
const threadService = new ThreadService();

/**
 * @swagger
 * /createEnhancedThread:
 *   post:
 *     summary: Create a new thread (Enhanced implementation)
 *     tags: [Threads]
 *     description: Creates a new thread with comprehensive error handling and validation
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateThreadRequest'
 *     responses:
 *       200:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThreadResponse'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
export const createEnhancedThread = createFunction(
  {
    name: 'createEnhancedThread',
    inputSchema: CreateThreadRequestSchema,
    outputSchema: ThreadResponseSchema,
    requireAuth: true,
    rateLimit: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 10, // 10 requests per minute
    },
    cacheResults: false, // Don't cache thread creation (side effects)
    timeout: 30000, // 30 seconds
    logLevel: 'info',
    onSuccess: (result, data, context, timing) => {
      // Additional success actions (e.g., analytics)
      functions.logger.info(`Thread created successfully in ${timing}ms`, {
        threadId: result.threadId,
        userId: context.auth?.uid
      });
    }
  },
  async (data, context) => {
    // Ensure auth is present (middleware should guarantee this)
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required'
      );
    }
    
    const userId = context.auth.uid;
    const { name, metadata = {} } = data;
    
    // Create thread via service
    const { threadId } = await threadService.createThread(name, metadata, userId);
    
    // Return standardized response
    return {
      success: true,
      threadId,
      timestamp: new Date().toISOString()
    };
  }
);