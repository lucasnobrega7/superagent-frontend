/**
 * Enhanced API Documentation System
 * 
 * A comprehensive API documentation system with:
 * - Automated route discovery
 * - Schema integration with Zod
 * - versioning support
 * - Multiple output formats (Swagger UI, JSON, Markdown)
 * - Performance optimizations
 */
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import express from 'express';
import * as functions from 'firebase-functions';
import * as fs from 'fs';
import * as path from 'path';
import { schemaRegistry } from './schema-registry';
import { errorTracking } from './error-tracking';

// Get package info
const packageInfo = require('../../package.json');

// Cache for documentation to avoid regenerating on every request
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
interface CachedDocs {
  spec: any;
  timestamp: number;
  version: string;
}

// Singleton cache for documentation
let docsCache: CachedDocs | null = null;

/**
 * API Documentation Manager
 */
export class ApiDocumentation {
  private static instance: ApiDocumentation;
  private initialized = false;
  private customExtensions: Array<(spec: any) => any> = [];
  
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiDocumentation {
    if (!ApiDocumentation.instance) {
      ApiDocumentation.instance = new ApiDocumentation();
    }
    return ApiDocumentation.instance;
  }

  /**
   * Initialize API documentation
   */
  public initialize(): void {
    if (this.initialized) {
      functions.logger.warn('API documentation already initialized');
      return;
    }
    
    this.initialized = true;
    functions.logger.info('API documentation initialized successfully');
  }

  /**
   * Add a custom extension to enhance the API specification
   * @param extension A function that takes and returns a spec object
   */
  public addExtension(extension: (spec: any) => any): void {
    this.customExtensions.push(extension);
  }

  /**
   * Create express app for serving Swagger docs
   * @param basePath Optional base path for the API
   * @returns Express app
   */
  public createExpressApp(basePath: string = '/'): express.Application {
    const transaction = errorTracking.startTransaction('createSwaggerApp', 'documentation');
    
    try {
      const app = express();
      
      // Serve Swagger UI
      app.use('/', swaggerUI.serve);
      
      // Get documentation with version
      app.get('/', (req, res) => {
        const span = transaction.startChild({ op: 'render-swagger-ui' });
        try {
          const version = req.query.version?.toString();
          const spec = this.getDocumentation(version);
          
          res.send(swaggerUI.generateHTML(spec, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Superagent API Documentation',
            customfavIcon: 'https://example.com/favicon.ico',
          }));
        } catch (error) {
          errorTracking.captureException(error, { component: 'swagger-ui' });
          res.status(500).send('Error rendering API documentation');
        } finally {
          span.finish();
        }
      });
      
      // Serve Swagger JSON
      app.get('/swagger.json', (req, res) => {
        const span = transaction.startChild({ op: 'serve-swagger-json' });
        try {
          const version = req.query.version?.toString();
          const spec = this.getDocumentation(version);
          
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=900'); // 15 minutes
          res.send(spec);
        } catch (error) {
          errorTracking.captureException(error, { component: 'swagger-json' });
          res.status(500).json({ error: 'Error generating API documentation' });
        } finally {
          span.finish();
        }
      });
      
      // Serve documentation as Markdown (for README generation)
      app.get('/docs.md', (req, res) => {
        const span = transaction.startChild({ op: 'generate-markdown' });
        try {
          const version = req.query.version?.toString();
          const spec = this.getDocumentation(version);
          const markdown = this.convertToMarkdown(spec);
          
          res.setHeader('Content-Type', 'text/markdown');
          res.setHeader('Cache-Control', 'public, max-age=900'); // 15 minutes
          res.send(markdown);
        } catch (error) {
          errorTracking.captureException(error, { component: 'markdown-docs' });
          res.status(500).send('Error generating Markdown documentation');
        } finally {
          span.finish();
        }
      });
      
      // Healthcheck endpoint
      app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
      });
      
      return app;
    } finally {
      transaction.finish();
    }
  }

  /**
   * Get API documentation
   * @param version Optional version (defaults to latest)
   * @returns Swagger specification
   */
  public getDocumentation(version?: string): any {
    // Check cache first
    if (docsCache && (Date.now() - docsCache.timestamp < CACHE_TTL_MS) && 
        (!version || version === docsCache.version)) {
      return docsCache.spec;
    }
    
    // Generate base documentation
    const spec = this.generateDocumentation(version);
    
    // Apply custom extensions
    const enhancedSpec = this.customExtensions.reduce(
      (currentSpec, extension) => extension(currentSpec),
      spec
    );
    
    // Update cache
    docsCache = {
      spec: enhancedSpec,
      timestamp: Date.now(),
      version: version || 'latest'
    };
    
    return enhancedSpec;
  }

  /**
   * Generate API documentation
   * @param version Optional version
   * @returns Swagger specification
   */
  private generateDocumentation(version?: string): any {
    const projectVersion = version || packageInfo.version || '1.0.0';
    
    // Generate base Swagger options
    const swaggerOptions: swaggerJSDoc.Options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Superagent Functions API',
          version: projectVersion,
          description: 'API documentation for Superagent and LiteralAI Functions',
          contact: {
            name: 'Support',
            email: 'support@example.com',
          },
          license: {
            name: 'Private',
            url: 'https://example.com/license'
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
          schemas: this.getSchemaComponents()
        },
        security: [
          {
            BearerAuth: [],
          },
        ],
      },
      // Path to API docs
      apis: this.discoverApiFiles(),
    };
    
    // Generate spec
    return swaggerJSDoc(swaggerOptions);
  }

  /**
   * Convert Swagger spec to Markdown documentation
   * @param spec Swagger specification
   * @returns Markdown documentation
   */
  private convertToMarkdown(spec: any): string {
    let markdown = `# ${spec.info.title} Documentation\n\n`;
    markdown += `**Version:** ${spec.info.version}\n\n`;
    markdown += `${spec.info.description || ''}\n\n`;
    
    // Add server information
    markdown += '## Servers\n\n';
    spec.servers.forEach((server: any) => {
      markdown += `- ${server.description}: \`${server.url}\`\n`;
    });
    
    // Add endpoints
    markdown += '\n## Endpoints\n\n';
    
    // Group endpoints by tag
    const taggedEndpoints: Record<string, any[]> = {};
    
    Object.keys(spec.paths).forEach(path => {
      const pathObj = spec.paths[path];
      
      Object.keys(pathObj).forEach(method => {
        const endpoint = pathObj[method];
        const tag = endpoint.tags?.[0] || 'Other';
        
        if (!taggedEndpoints[tag]) {
          taggedEndpoints[tag] = [];
        }
        
        taggedEndpoints[tag].push({
          path,
          method,
          ...endpoint
        });
      });
    });
    
    // Generate markdown for each tag
    Object.keys(taggedEndpoints).forEach(tag => {
      markdown += `### ${tag}\n\n`;
      
      taggedEndpoints[tag].forEach(endpoint => {
        markdown += `#### \`${endpoint.method.toUpperCase()}\` ${endpoint.path}\n\n`;
        markdown += `${endpoint.description || endpoint.summary || ''}\n\n`;
        
        // Add request body information if present
        if (endpoint.requestBody) {
          markdown += '**Request Body:**\n\n';
          markdown += '```json\n';
          
          const content = endpoint.requestBody.content['application/json'];
          if (content && content.schema) {
            if (content.schema.$ref) {
              const refPath = content.schema.$ref.split('/');
              const schemaName = refPath[refPath.length - 1];
              const schema = spec.components.schemas[schemaName];
              
              markdown += JSON.stringify(this.generateSampleFromSchema(schema), null, 2);
            } else {
              markdown += JSON.stringify(this.generateSampleFromSchema(content.schema), null, 2);
            }
          } else {
            markdown += '{}';
          }
          
          markdown += '\n```\n\n';
        }
        
        // Add response information
        markdown += '**Responses:**\n\n';
        
        Object.keys(endpoint.responses).forEach(statusCode => {
          const response = endpoint.responses[statusCode];
          markdown += `- \`${statusCode}\`: ${response.description}\n`;
        });
        
        markdown += '\n---\n\n';
      });
    });
    
    return markdown;
  }

  /**
   * Generate a sample object from a schema
   * @param schema JSON schema object
   * @returns A sample object matching the schema
   */
  private generateSampleFromSchema(schema: any): any {
    if (!schema) return {};
    
    if (schema.example) {
      return schema.example;
    }
    
    if (schema.type === 'object') {
      const result: Record<string, any> = {};
      
      if (schema.properties) {
        Object.keys(schema.properties).forEach(propName => {
          const propSchema = schema.properties[propName];
          result[propName] = this.generateSampleFromSchema(propSchema);
        });
      }
      
      return result;
    }
    
    if (schema.type === 'array') {
      return [this.generateSampleFromSchema(schema.items)];
    }
    
    // Generate sample values for different types
    switch (schema.type) {
      case 'string':
        return schema.enum ? schema.enum[0] : 'string';
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      default:
        return null;
    }
  }

  /**
   * Get schema components from the registry
   * @returns Schema components for OpenAPI documentation
   */
  private getSchemaComponents(): Record<string, any> {
    return schemaRegistry.getAllJsonSchemas();
  }

  /**
   * Discover API files for documentation
   * @returns Array of file paths
   */
  private discoverApiFiles(): string[] {
    const basePath = path.resolve(__dirname, '..');
    const result: string[] = [];
    
    // Helper function to recursively discover files
    const discoverFiles = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and test directories
          if (entry.name !== 'node_modules' && !entry.name.includes('test')) {
            discoverFiles(fullPath);
          }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
          // Check if file contains @swagger annotation
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@swagger')) {
              result.push(fullPath);
            }
          } catch (e) {
            // Ignore file read errors
          }
        }
      }
    };
    
    discoverFiles(basePath);
    return result;
  }
}

// Export singleton instance
export const apiDocumentation = ApiDocumentation.getInstance();