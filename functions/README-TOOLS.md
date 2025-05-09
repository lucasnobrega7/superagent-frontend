# Advanced Firebase Functions Tools

This document describes the additional tools and libraries integrated into the Firebase Functions codebase to enhance development, reliability, and maintainability.

## TypeScript Strict Mode

TypeScript strict mode has been enabled to catch more potential issues at compile time:

- `strict: true` in tsconfig.json
- Additional strict checks for null/undefined values
- Proper typing for function parameters and returns
- Explicit error handling

## Zod Schema Validation

[Zod](https://github.com/colinhacks/zod) is used for runtime data validation and type safety:

### Key Features:
- **Schema Definition**: Define schemas in `src/schemas/index.ts`
- **Type Inference**: Automatically generate TypeScript types from Zod schemas
- **Runtime Validation**: Validate incoming data at runtime
- **Error Handling**: Clear error messages for invalid data

### Usage Example:
```typescript
import { validateRequest } from '../middleware/zod-validator';
import { CreateThreadSchema } from '../schemas';

// Validate request data
const validatedData = validateRequest(CreateThreadSchema)(data);
```

## OpenAPI (Swagger) Documentation

API documentation is automatically generated using Swagger:

### Key Features:
- **Swagger UI**: Interactive API documentation at `/apiDocs`
- **JSDoc Annotations**: Document APIs using JSDoc comments
- **Automatic Generation**: Documentation generated from code
- **Self-Documenting**: Clients can discover API capabilities

### Accessing Documentation:
- When running locally: http://localhost:5001/sabrinaai-2a39e/us-central1/apiDocs
- In production: https://us-central1-agentesdeconversao.cloudfunctions.net/apiDocs

### Adding Documentation to Functions:
```typescript
/**
 * @swagger
 * /yourFunctionName:
 *   post:
 *     summary: Short description
 *     tags: [Category]
 *     description: Longer description
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               property:
 *                 type: string
 */
```

## Sentry Error Tracking

[Sentry](https://sentry.io) is integrated for advanced error tracking:

### Key Features:
- **Error Capturing**: Automatically capture and report errors
- **Context**: Add user and context information to errors
- **Performance Monitoring**: Track function performance
- **Exception Handling**: Custom exception handlers

### Usage:
```typescript
import { withSentry, captureException } from '../utils/sentry';

// Wrap functions for automatic error tracking
export const myFunction = functions.https.onCall(
  withSentry(async (data, context) => {
    // Function code here
  })
);

// Manually capture errors
try {
  // Risky code
} catch (error) {
  captureException(error, { 
    extra: { customData: 'value' } 
  });
  throw error;
}
```

### Configuration:
Set the `SENTRY_DSN` environment variable to enable Sentry in production.

## Getting Started with These Tools

1. **Use Zod for Validation**:
   - Define schemas in `src/schemas/index.ts`
   - Use the validation middleware in your functions
   - See an example in `src/examples/zod-example.ts`

2. **Document Your APIs**:
   - Add JSDoc comments with Swagger annotations
   - Check the documentation at the `/apiDocs` endpoint
   - Browse the API docs at: http://localhost:5001/sabrinaai-2a39e/us-central1/apiDocs

3. **Track Errors with Sentry**:
   - Wrap functions with `withSentry`
   - Add context to errors when needed
   - Configure your SENTRY_DSN in the environment variables

4. **Leverage TypeScript Strict Mode**:
   - Pay attention to null/undefined checks
   - Use proper type annotations

## Implementation Details

### Installed Packages
```json
{
  "zod": "^3.24.4",
  "zod-to-ts": "^1.2.0",
  "@sentry/node": "^9.17.0",
  "@sentry/profiling-node": "^9.17.0",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1"
}
```

### Created Files
- `src/schemas/index.ts` - Zod schemas and types
- `src/middleware/zod-validator.ts` - Zod validation middleware
- `src/swagger.ts` - OpenAPI/Swagger configuration
- `src/utils/sentry.ts` - Sentry error tracking setup
- `src/examples/zod-example.ts` - Example implementation

### Available Endpoints
- API Documentation: `/apiDocs`
- Example Function: `/exampleCreateThread`