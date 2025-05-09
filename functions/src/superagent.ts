/**
 * Superagent integration functions
 */
import { onCall, onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { superagentService } from "./services/superagent-service";
import { validateAgentData, validateLLMData, validateAgentInvocationData, validateAuthentication } from "./utils/validators";
import { handleError, ValidationError, createAuthError } from "./utils/error-handler";

// Function configuration
const functionConfig = {
  region: "us-central1",
  timeoutSeconds: 60,
  maxInstances: 10
};

/**
 * List all agents available to the user
 */
export const listAgents = onCall(functionConfig, async (request) => {
  try {
    // Authentication is optional for listing public agents
    logger.info("Listing agents", { userId: request.auth?.uid });
    
    // Get agents from Superagent API
    const agents = await superagentService.listAgents();
    
    // If user is not authenticated, only return public agents
    if (!request.auth) {
      const publicAgents = agents.filter(agent => agent.isPublic);
      return { agents: publicAgents };
    }
    
    return { agents };
  } catch (error) {
    logger.error("Error listing agents", error);
    throw handleError(error);
  }
});

/**
 * Create a new agent
 */
export const createAgent = onCall(functionConfig, async (request) => {
  try {
    // Verify authentication
    const authError = validateAuthentication(request.auth);
    if (authError) {
      throw createAuthError(authError);
    }
    
    // Validate input data
    const validationError = validateAgentData(request.data);
    if (validationError) {
      throw new ValidationError(validationError);
    }
    
    logger.info("Creating agent", { 
      userId: request.auth.uid,
      agentName: request.data.name
    });
    
    // Create agent via Superagent API
    const agent = await superagentService.createAgent({
      name: request.data.name,
      description: request.data.description,
      initialMessage: request.data.initialMessage,
      llmModel: request.data.llmModel,
      isPublic: !!request.data.isPublic
    });
    
    // Add user ID to the response for client-side permissions
    return {
      success: true,
      agent: {
        ...agent,
        userId: request.auth.uid
      }
    };
  } catch (error) {
    logger.error("Error creating agent", error);
    throw handleError(error);
  }
});

/**
 * List all available LLM models
 */
export const listLLMs = onCall(functionConfig, async (request) => {
  try {
    // Verify authentication
    const authError = validateAuthentication(request.auth);
    if (authError) {
      throw createAuthError(authError);
    }
    
    logger.info("Listing LLM models", { userId: request.auth.uid });
    
    // Get LLMs from Superagent API
    const llms = await superagentService.listLLMs();
    
    return { llms };
  } catch (error) {
    logger.error("Error listing LLMs", error);
    throw handleError(error);
  }
});

/**
 * Create a new LLM model configuration
 */
export const createLLM = onCall(functionConfig, async (request) => {
  try {
    // Verify authentication
    const authError = validateAuthentication(request.auth);
    if (authError) {
      throw createAuthError(authError);
    }
    
    // Validate input data
    const validationError = validateLLMData(request.data);
    if (validationError) {
      throw new ValidationError(validationError);
    }
    
    logger.info("Creating LLM model", { 
      userId: request.auth.uid,
      provider: request.data.provider,
      model: request.data.model
    });
    
    // Create LLM via Superagent API
    const llm = await superagentService.createLLM({
      provider: request.data.provider,
      model: request.data.model,
      apiKey: request.data.apiKey
    });
    
    return {
      success: true,
      llm
    };
  } catch (error) {
    logger.error("Error creating LLM model", error);
    throw handleError(error);
  }
});

/**
 * List all available datasources
 */
export const listDatasources = onCall(functionConfig, async (request) => {
  try {
    // Verify authentication
    const authError = validateAuthentication(request.auth);
    if (authError) {
      throw createAuthError(authError);
    }
    
    logger.info("Listing datasources", { userId: request.auth.uid });
    
    // Get datasources from Superagent API
    const datasources = await superagentService.listDatasources();
    
    return { datasources };
  } catch (error) {
    logger.error("Error listing datasources", error);
    throw handleError(error);
  }
});

/**
 * List all available tools
 */
export const listTools = onCall(functionConfig, async (request) => {
  try {
    // Verify authentication
    const authError = validateAuthentication(request.auth);
    if (authError) {
      throw createAuthError(authError);
    }
    
    logger.info("Listing tools", { userId: request.auth.uid });
    
    // Get tools from Superagent API
    const tools = await superagentService.listTools();
    
    return { tools };
  } catch (error) {
    logger.error("Error listing tools", error);
    throw handleError(error);
  }
});

/**
 * Invoke an agent with a prompt
 */
export const invokeAgent = onCall({
  ...functionConfig,
  timeoutSeconds: 120 // Longer timeout for invocation
}, async (request) => {
  try {
    // Verify authentication
    const authError = validateAuthentication(request.auth);
    if (authError) {
      throw createAuthError(authError);
    }
    
    // Validate input data
    const validationError = validateAgentInvocationData(request.data);
    if (validationError) {
      throw new ValidationError(validationError);
    }
    
    const { id, input, sessionId } = request.data;
    
    logger.info("Invoking agent", { 
      userId: request.auth.uid,
      agentId: id,
      sessionId: sessionId || "none"
    });
    
    // Invoke agent via Superagent API
    const response = await superagentService.invokeAgent(id, input, sessionId);
    
    return {
      success: true,
      output: response.output || response.text || "No response from agent",
      usage: response.usage || {},
      sessionId: response.session_id || sessionId
    };
  } catch (error) {
    logger.error("Error invoking agent", error);
    throw handleError(error);
  }
});

/**
 * Test external API connectivity
 */
export const testExternalApi = onCall(functionConfig, async (request) => {
  try {
    // This function uses the Superagent API as the external API to test
    const result = await superagentService.listAgents();

    return {
      success: true,
      message: "Successfully connected to external API",
      timestamp: new Date().toISOString(),
      data: { count: result.length }
    };
  } catch (error) {
    logger.error("Error testing external API", error);
    return {
      success: false,
      message: "Failed to connect to external API",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
});

/**
 * Health check endpoint for Superagent service
 * Returns status information about the service
 */
export const healthCheck = onRequest(functionConfig, async (req, res) => {
  logger.info("Health check requested", {
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  try {
    // Get API status by checking if we can list agents
    const apiStatus = await superagentService.listAgents()
      .then(() => ({ status: "healthy", message: "API is responding normally" }))
      .catch(error => ({
        status: "degraded",
        message: "API connection issues",
        error: error instanceof Error ? error.message : String(error)
      }));

    // Get current function configuration
    const config = {
      environment: process.env.NODE_ENV || "development",
      region: functionConfig.region,
      timeoutSeconds: functionConfig.timeoutSeconds,
      apiUrl: process.env.SUPERAGENT_API_URL || "https://api.superagent.sh"
    };

    // Assemble response data
    const healthData = {
      service: "superagent",
      status: apiStatus.status === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.FUNCTION_VERSION || "1.0.0",
      api: apiStatus,
      config,
      uptime: process.uptime()
    };

    // Set appropriate status code based on health
    const statusCode = apiStatus.status === "healthy" ? 200 : 503;

    // Add CORS headers to allow cross-origin requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');

    // Send response
    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error("Error in health check", error);

    // Add CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');

    // Send error response
    res.status(500).json({
      service: "superagent",
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});