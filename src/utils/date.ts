/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";
import { spawn } from "child_process";
import { promisify } from "util";

// Date format constants for AppleScript compatibility
const DATE_FORMAT_12_HOUR = "MMMM D, YYYY h:mm:ss A" as const;
const DATE_FORMAT_24_HOUR = "MMMM D, YYYY HH:mm:ss" as const;

/**
 * Manages system time preference caching and retrieval
 */
class TimePreferenceManager {
  private static cache: boolean | undefined;
  
  /**
   * Get the current 24-hour time preference
   */
  static get24HourPreference(): boolean {
    if (this.cache === undefined) {
      this.cache = false; // Safe default
      this.initializeAsync(); // Start async initialization
    }
    return this.cache;
  }
  
  /**
   * Initialize the time preference asynchronously
   */
  private static async initializeAsync(): Promise<void> {
    try {
      const result = await this.fetchSystemPreference();
      this.cache = result;
      debugLog(`System time preference initialized: ${result ? '24-hour' : '12-hour'}`);
    } catch (error) {
      this.cache = false;
      debugLog(`Failed to determine time preference, using 12-hour: ${(error as Error).message}`);
    }
  }
  
  /**
   * Fetch system preference via secure command
   */
  private static async fetchSystemPreference(): Promise<boolean> {
    const result = await safeSystemCommand('defaults', ['read', '-g', 'AppleICUForce24HourTime']);
    return result === '1';
  }
  
  /**
   * Clear cache for testing purposes only
   */
  static clearCache(): void {
    if (process.env.NODE_ENV === 'test') {
      this.cache = undefined;
    }
  }
}

/**
 * Clear the cached system time preference for testing purposes only.
 * @internal
 */
export function clearTimePreferenceCache(): void {
  TimePreferenceManager.clearCache();
}

/**
 * Safely executes system command to read preferences
 * @param command - Command to execute 
 * @param args - Command arguments
 * @param timeout - Timeout in milliseconds
 * @returns Promise with command output
 */
async function safeSystemCommand(command: string, args: string[], timeout = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
        // Validate command and arguments for security
        const allowedCommands = ['defaults'];
        const allowedDefaultsArgs = ['-g', 'AppleICUForce24HourTime', 'read'];
        
        if (!allowedCommands.includes(command)) {
            reject(new Error(`Command not allowed: ${command}`));
            return;
        }
        
        // Validate arguments for defaults command
        if (command === 'defaults') {
            const hasInvalidArg = args.some(arg => 
                !allowedDefaultsArgs.includes(arg) && 
                !arg.startsWith('Apple') // Allow Apple* preference keys
            );
            if (hasInvalidArg) {
                reject(new Error(`Invalid arguments for defaults command`));
                return;
            }
        }
        
        const process = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: timeout,
            detached: false,
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                reject(new Error(`Command failed with code ${code}: ${stderr}`));
            }
        });
        
        process.on('error', (error) => {
            reject(new Error(`Process error: ${error.message}`));
        });
        
        // Set timeout
        setTimeout(() => {
            if (!process.killed) {
                process.kill('SIGTERM');
            }
            reject(new Error(`Command timed out after ${timeout}ms`));
        }, timeout);
    });
}


/**
 * Parses a date string in various formats and returns a formatted date string
 * suitable for AppleScript with locale-independent English month names
 * 
 * @param dateStr - Date string in standard format (YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, or ISO 8601)
 * @returns Formatted date string in English locale: "MMMM D, YYYY HH:mm:ss" (24h) or "MMMM D, YYYY h:mm:ss A" (12h)
 * @throws Error if the date format is invalid or unsupported
 * 
 * @example
 * ```typescript
 * parseDate('2024-12-25 18:30:00') // Returns: "December 25, 2024 6:30:00 PM" (12h system)
 * parseDate('2024-12-25 18:30:00') // Returns: "December 25, 2024 18:30:00" (24h system)
 * ```
 */
export function parseDate(dateStr: string): string {
  try {
    // Try parsing with moment, expecting 'YYYY-MM-DD HH:mm:ss' or other moment-parsable formats
    const parsedDate = moment(dateStr, [
      "YYYY-MM-DD HH:mm:ss", // Explicitly handle the documented format first
      moment.ISO_8601,       // Handle ISO formats
      "YYYY-MM-DD",          // Handle date-only format
    ], true); // Use strict parsing

    // If not valid, throw error with helpful context
    if (!parsedDate.isValid()) {
      throw new Error(
        `Invalid or unsupported date format: "${dateStr}". ` +
        `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
        `Example: "2024-12-25 14:30:00"`
      );
    }

    // Check if system uses 24-hour time
    const use24Hour = TimePreferenceManager.get24HourPreference();

    // Format with English locale for AppleScript compatibility
    const englishMoment = parsedDate.locale('en');
    const formattedDate = use24Hour 
        ? englishMoment.format(DATE_FORMAT_24_HOUR)
        : englishMoment.format(DATE_FORMAT_12_HOUR);
    
    debugLog(`Parsed date (${use24Hour ? '24' : '12'}-hour):`, formattedDate);
    return formattedDate;
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw new Error(
      `Invalid or unsupported date format: "${dateStr}". ` +
      `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
      `Example: "2024-12-25 14:30:00"`
    );
  }
} 