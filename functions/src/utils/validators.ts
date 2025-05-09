/**
 * Validators for Firebase Functions
 * Provides validation functions for checking data inputs to Cloud Functions
 */
import * as functions from "firebase-functions";
import { https } from "firebase-functions/v2";

/**
 * Define AuthData type to match what we're using
 */
export type AuthData = {
  uid: string;
  token?: {
    email?: string;
    name?: string;
    [key: string]: any;
  };
};

/**
 * Create an error response for validation failures
 */
export function createValidationError(message: string, details?: any): https.HttpsError {
  return new https.HttpsError(
    "invalid-argument",
    message,
    details
  );
}

/**
 * Validates agent creation/update data
 */
export function validateAgentData(data: any): string | null {
  const { name, description, llmModel } = data;
  const errors = [];
  
  if (!name || typeof name !== "string" || name.length < 3) {
    errors.push("Name must be a string with at least 3 characters");
  }
  
  if (!description || typeof description !== "string") {
    errors.push("Description is required and must be a string");
  }
  
  if (llmModel !== undefined && (typeof llmModel !== "string" || llmModel.length === 0)) {
    errors.push("If provided, llmModel must be a non-empty string");
  }
  
  // Return null if no errors, or a joined string of errors
  return errors.length > 0 ? errors.join(", ") : null;
}

/**
 * Validates LLM model data
 */
export function validateLLMData(data: any): string | null {
  const { provider, model } = data;
  const errors = [];
  
  if (!provider || typeof provider !== "string") {
    errors.push("Provider is required and must be a string");
  }
  
  if (!model || typeof model !== "string") {
    errors.push("Model is required and must be a string");
  }
  
  // Return null if no errors, or a joined string of errors
  return errors.length > 0 ? errors.join(", ") : null;
}

/**
 * Validates datasource data
 */
export function validateDatasourceData(data: any): string | null {
  const { name, description, type } = data;
  const errors = [];
  
  if (!name || typeof name !== "string") {
    errors.push("Name is required and must be a string");
  }
  
  if (description !== undefined && typeof description !== "string") {
    errors.push("If provided, description must be a string");
  }
  
  if (!type || typeof type !== "string") {
    errors.push("Type is required and must be a string");
  }
  
  // Return null if no errors, or a joined string of errors
  return errors.length > 0 ? errors.join(", ") : null;
}

/**
 * Validates agent invocation data
 */
export function validateAgentInvocationData(data: any): string | null {
  const { id, input } = data;
  const errors = [];
  
  if (!id || typeof id !== "string") {
    errors.push("Agent ID is required and must be a string");
  }
  
  if (!input || (typeof input !== "string" && typeof input !== "object")) {
    errors.push("Input is required and must be a string or object");
  }
  
  // Return null if no errors, or a joined string of errors
  return errors.length > 0 ? errors.join(", ") : null;
}

/**
 * Ensures that the user is authenticated
 */
export function validateAuthentication(auth: AuthData | undefined): string | null {
  if (!auth) {
    return "Authentication required";
  }
  return null;
}