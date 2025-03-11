/**
 * logger.ts
 * Provides logging utilities for debugging and error reporting
 */

/**
 * Logger class for consistent logging
 */
export class Logger {
  /**
   * Log an informational message
   * @param args - Arguments to log
   */
  info(...args: any[]): void {
    console.log("[INFO]", ...args);
  }
  
  /**
   * Log a debug message
   * @param args - Arguments to log
   */
  debug(...args: any[]): void {
    console.error("[DEBUG]", ...args);
  }
  
  /**
   * Log a warning message
   * @param args - Arguments to log
   */
  warn(...args: any[]): void {
    console.warn("[WARN]", ...args);
  }
  
  /**
   * Log an error message
   * @param message - Error message
   * @param error - Optional error object
   */
  error(message: string, error?: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[ERROR]", `${message}${error ? ': ' + errorMessage : ''}`);
  }
}

// Export a singleton instance
export const logger = new Logger();

/**
 * Writes debug messages to stderr (legacy function)
 * @param args - Arguments to log
 */
export function debugLog(...args: any[]): void {
  logger.debug(...args);
}

/**
 * Logs errors with additional context (legacy function)
 * @param message - Error message
 * @param error - Optional error object
 */
export function logError(message: string, error?: unknown): void {
  logger.error(message, error);
} 