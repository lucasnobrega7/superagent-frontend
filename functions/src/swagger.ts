/**
 * OpenAPI/Swagger configuration for API documentation
 */
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';
import * as functions from 'firebase-functions';

// Get package info
const packageInfo = require('../package.json');

// Swagger definition
const swaggerOptions: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Superagent Functions API',
      version: packageInfo.version || '1.0.0',
      description: 'API documentation for Superagent and LiteralAI Functions',
      contact: {
        name: 'Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'https://us-central1-agentesdeconversao.cloudfunctions.net',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:5001/sabrinaai-2a39e/us-central1',
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  // Path to API docs
  apis: ['./src/**/*.ts'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Create express app for serving Swagger docs
export const createSwaggerApp = () => {
  const app = express();
  
  // Serve Swagger docs at /api-docs
  app.use('/', swaggerUi.serve);
  app.get('/', swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Superagent API Documentation',
  }));

  // Serve Swagger JSON at /swagger.json
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  return app;
};

// Export Swagger spec for external use
export const getSwaggerSpec = () => swaggerSpec;