/**
 * errorHandling.ts
 * Centralized error handling utilities for consistent error responses
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ValidationError } from "../validation/schemas.js";

/**
 * Error response factory for consistent error handling across all tools
 */
export class ErrorResponseFactory {
  /**
   * Creates a standardized error response for tool operations
   */
  static createErrorResponse(operation: string, error: unknown): CallToolResult {
    const message = this.determineErrorMessage(operation, error);
    
    return {
      content: [{ type: "text", text: message }],
      isError: true,
    };
  }

  /**
   * Creates a JSON error response for operations that return JSON
   */
  static createJsonErrorResponse(operation: string, error: unknown): CallToolResult {
    const message = this.determineErrorMessage(operation, error);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: message,
          isError: true
        }, null, 2)
      }],
      isError: true,
    };
  }

  /**
   * Creates a success response with a standardized format
   */
  static createSuccessResponse(message: string): CallToolResult {
    return {
      content: [{ type: "text", text: message }],
      isError: false,
    };
  }

  /**
   * Creates a JSON success response for operations that return JSON
   */
  static createJsonSuccessResponse(data: unknown): CallToolResult {
    return {
      content: [{
        type: "text",
        text: JSON.stringify(data, null, 2)
      }],
      isError: false,
    };
  }

  /**
   * Determines the appropriate error message based on error type
   */
  private static determineErrorMessage(operation: string, error: unknown): string {
    if (error instanceof ValidationError) {
      return `Input validation failed: ${error.message}`;
    }
    
    if (error instanceof Error) {
      // Only expose system error details in development/debug mode
      return process.env.NODE_ENV === 'development' || process.env.DEBUG
        ? `Failed to ${operation}: ${error.message}`
        : `Failed to ${operation}: System error occurred`;
    }
    
    return `Failed to ${operation}: System error occurred`;
  }
}

/**
 * Utility for handling async operations with consistent error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  responseFactory: (result: T) => CallToolResult = (result) => 
    ErrorResponseFactory.createSuccessResponse(String(result))
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return responseFactory(result);
  } catch (error) {
    return ErrorResponseFactory.createErrorResponse(operationName, error);
  }
}

/**
 * Utility for handling async operations that return JSON responses
 */
export async function handleJsonAsyncOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return ErrorResponseFactory.createJsonSuccessResponse(result);
  } catch (error) {
    return ErrorResponseFactory.createJsonErrorResponse(operationName, error);
  }
}