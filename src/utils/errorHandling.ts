/**
 * errorHandling.ts
 * Centralized error handling utilities for consistent error responses
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Simplified error handling utilities
 */
export class ErrorResponseFactory {
  static createErrorResponse(operation: string, error: unknown): CallToolResult {
    const message = error instanceof Error ? error.message : 'System error occurred';
    const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG;
    const errorMessage = isDev ? `Failed to ${operation}: ${message}` : `Failed to ${operation}: System error occurred`;

    return {
      content: [{ type: "text", text: errorMessage }],
      isError: true,
    };
  }

  static createJsonErrorResponse(operation: string, error: unknown): CallToolResult {
    const message = error instanceof Error ? error.message : 'System error occurred';
    const data = { error: `Failed to ${operation}: ${message}`, isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      isError: true,
    };
  }

  static createSuccessResponse(message: string): CallToolResult {
    return {
      content: [{ type: "text", text: message }],
      isError: false,
    };
  }

  static createJsonSuccessResponse(data: unknown): CallToolResult {
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      isError: false,
    };
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