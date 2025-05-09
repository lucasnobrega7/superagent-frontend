/**
 * Error handling utilities for Firebase Functions
 */
import { logger } from "firebase-functions";
import { https } from "firebase-functions/v2";

/**
 * Firebase error codes mapped to HTTP status codes
 */
const ERROR_CODES: Record<number, string> = {
  400: "invalid-argument",
  401: "unauthenticated",
  403: "permission-denied",
  404: "not-found",
  409: "already-exists",
  429: "resource-exhausted",
  500: "internal",
  501: "unimplemented",
  503: "unavailable"
};

/**
 * Convert HTTP error status to Firebase error code
 */
function getErrorCode(status: number): string {
  // Check if the status code exists in our mapping
  if (ERROR_CODES[status]) {
    return ERROR_CODES[status];
  }

  // Default to 'unknown' for unmapped status codes
  return "unknown";
}

/**
 * Handle errors from API calls and other sources
 */
export function handleError(error: any): https.HttpsError {
  // Log the error
  logger.error("Error caught by handler:", error);
  
  // If it's already a HttpsError, just return it
  if (error instanceof https.HttpsError) {
    return error;
  }
  
  // Handle axios errors with response
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message || "API request failed";
    return new https.HttpsError(
      getErrorCode(status) as any,
      message,
      {
        status,
        details: error.response.data
      }
    );
  }
  
  // Handle network errors
  if (error.request) {
    return new https.HttpsError(
      "unavailable",
      "Network error: Unable to reach API service",
      { originalError: error.message }
    );
  }
  
  // Handle validation errors with structured messages
  if (error.isValidationError) {
    return new https.HttpsError(
      "invalid-argument",
      error.message,
      { validationErrors: error.details }
    );
  }
  
  // Default error handling
  return new https.HttpsError(
    "internal",
    error.message || "An unexpected error occurred",
    { originalError: String(error) }
  );
}

/**
 * Create a validation error
 */
export class ValidationError extends Error {
  isValidationError = true;
  details: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

/**
 * Create an authentication error
 */
export function createAuthError(message: string = "Authentication required"): https.HttpsError {
  return new https.HttpsError(
    "unauthenticated",
    message
  );
}