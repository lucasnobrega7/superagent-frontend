/**
 * Enhanced Functions System
 * 
 * Main entry point for the enhanced functions system with:
 * - Schema validation
 * - Error tracking
 * - API documentation
 * - Middleware
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { schemaRegistry } from './schema-registry';
import { errorTracking } from './error-tracking';
import { apiDocumentation } from './api-documentation';
import { createFunction, createHttpFunction } from './function-middleware';

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize enhanced systems
errorTracking.initialize({
  enabled: true,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.FUNCTION_VERSION || '1.0.0',
  dsn: process.env.SENTRY_DSN,
  debug: process.env.NODE_ENV !== 'production',
  performanceTracking: true,
  sampleRate: 1.0,
  rateLimitPerMinute: 100
});

// Initialize API documentation
apiDocumentation.initialize();

// Add standard extensions to documentation
apiDocumentation.addExtension((spec) => {
  // Add global description
  spec.info.description += '\n\n## Enhanced API\nThis API includes comprehensive validation, error handling, and performance monitoring.';
  
  // Add health check endpoint
  spec.paths['/health'] = {
    get: {
      summary: 'API Health Check',
      description: 'Check if the API is operational',
      tags: ['System'],
      responses: {
        '200': {
          description: 'API is operational',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'ok'
                  },
                  version: {
                    type: 'string',
                    example: '1.0.0'
                  },
                  environment: {
                    type: 'string',
                    example: 'production'
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  
  return spec;
});

// Export documentation endpoint
export const enhancedApiDocs = functions.https.onRequest(
  apiDocumentation.createExpressApp('/api-docs')
);

// System status endpoint
export const enhancedHealthCheck = createHttpFunction(
  {
    name: 'enhancedHealthCheck',
    logLevel: 'debug',
  },
  async (req, res) => {
    // Check system status
    res.status(200).json({
      status: 'ok',
      version: process.env.FUNCTION_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      components: {
        validation: {
          status: 'ok',
          schemas: schemaRegistry.getSchemaNames().length
        },
        documentation: {
          status: 'ok',
        },
        errorTracking: {
          status: 'ok',
          enabled: true
        }
      }
    });
  }
);

// Export sample functions
import { createEnhancedThread } from './examples/thread-service';
export { createEnhancedThread };