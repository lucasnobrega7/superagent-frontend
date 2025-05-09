/**
 * Example implementation using Zod validation
 */
import * as functions from 'firebase-functions';
import { withSentry } from '../utils/sentry';
import { validateRequest, validateAuth } from '../middleware/zod-validator';
import { 
  CreateThreadSchema, 
  ThreadResponseSchema,
  AuthSchema
} from '../schemas';

// Function configuration
const functionConfig = {
  region: "us-central1",
  timeoutSeconds: 60,
  maxInstances: 10
};

/**
 * @swagger
 * /createThreadExample:
 *   post:
 *     summary: Create a new thread (Zod validated example)
 *     tags: [Examples]
 *     description: Example function demonstrating Zod validation
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the thread
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the thread
 *     responses:
 *       200:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threadId:
 *                   type: string
 *                   description: The ID of the created thread
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
export const createThreadExample = functions.https.onCall(
  withSentry(async (data: unknown, context: unknown) => {
    // Validate authentication using Zod
    validateAuth(AuthSchema)(context);
    
    // Validate request data using Zod
    const validatedData = validateRequest(CreateThreadSchema)(data);
    
    // Process the validated data
    console.log(`Creating thread with name: ${validatedData.name}`);
    
    // You would normally call your service here to create the thread
    const threadId = `example-thread-${Date.now()}`;
    
    // Return a validated response
    return ThreadResponseSchema.parse({
      success: true,
      timestamp: new Date().toISOString(),
      threadId
    });
  })
);