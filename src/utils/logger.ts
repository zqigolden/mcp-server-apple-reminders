/**
 * logger.ts
 * Provides logging utilities for debugging and error reporting
 */

/**
 * Writes debug messages to stderr
 * @param args - Arguments to log
 */
export function debugLog(...args: any[]): void {
  console.error("[DEBUG]", ...args);
}

/**
 * Logs errors with additional context
 * @param message - Error message
 * @param error - Optional error object
 */
export function logError(message: string, error?: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  debugLog(`${message}: ${errorMessage}`);
} 