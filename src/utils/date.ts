/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";
import { spawn } from "child_process";
import { promisify } from "util";

// Date format constants for AppleScript compatibility
const DATE_ONLY_FORMAT = "MMMM D, YYYY" as const;
const DATETIME_FORMAT_12_HOUR = "MMMM D, YYYY h:mm:ss A" as const;
const DATETIME_FORMAT_24_HOUR = "MMMM D, YYYY HH:mm:ss" as const;

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
<<<<<<< HEAD
 * Checks if a date string represents a date-only format (YYYY-MM-DD without time)
 * @param dateStr - Date string to check
 * @returns true if the string is in date-only format, false otherwise
=======
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
>>>>>>> refactor/code-simplification
 * 
 * @example
 * ```typescript
 * isDateOnlyFormat('2024-12-25') // Returns: true
 * isDateOnlyFormat('2024-12-25 14:30:00') // Returns: false
 * isDateOnlyFormat('2024-12-25T14:30:00Z') // Returns: false
 * ```
 */
export function isDateOnlyFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}

/**
 * Result of parsing a date string, containing both formatted date and type information
 */
export interface ParsedDate {
  /** The formatted date string suitable for AppleScript */
  formatted: string;
  /** Whether this represents a date-only (true) or datetime (false) */
  isDateOnly: boolean;
}

/**
 * Parses a date string and returns both the formatted result and type information
 * @param dateStr - Date string in standard format
 * @returns Object containing formatted date and type information
 * @throws Error if the date format is invalid or unsupported
 */
export function parseDateWithType(dateStr: string): ParsedDate {
  const isDateOnly = isDateOnlyFormat(dateStr);
  const formatted = formatParsedDate(dateStr, isDateOnly);
  
  return { formatted, isDateOnly };
}

/**
 * Generates AppleScript property string for date handling
 * @param dateStr - Date string to parse
 * @param quoteFn - Function to quote AppleScript strings
 * @returns AppleScript property string for the appropriate date type
 */
export function generateDateProperty(dateStr: string, quoteFn: (str: string) => string): string {
  const isDateOnly = isDateOnlyFormat(dateStr);
  const formatted = formatParsedDate(dateStr, isDateOnly);
  const dateType = isDateOnly ? 'allday due date' : 'due date';
  return `, ${dateType}:date ${quoteFn(formatted)}`;
}

/**
 * Internal helper to format a parsed date based on type
 * @param dateStr - Date string to parse
 * @param isDateOnly - Whether this is a date-only format
 * @returns Formatted date string
 * @throws Error if the date format is invalid
 */
function formatParsedDate(dateStr: string, isDateOnly: boolean): string {
  try {
    const parsedDate = moment(dateStr, [
      "YYYY-MM-DD HH:mm:ss", // Explicitly handle the documented format first
      moment.ISO_8601,       // Handle ISO formats
      "YYYY-MM-DD",          // Handle date-only format
    ], true); // Use strict parsing

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
    
    if (isDateOnly) {
      const formatted = englishMoment.format(DATE_ONLY_FORMAT);
      debugLog("Parsed date (date-only):", formatted);
      return formatted;
    }
    
    const format = use24Hour ? DATETIME_FORMAT_24_HOUR : DATETIME_FORMAT_12_HOUR;
    const formatted = englishMoment.format(format);
    debugLog(`Parsed date (${use24Hour ? '24' : '12'}-hour):`, formatted);
    return formatted;
  } catch (error) {
    // Re-throw with standardized error message
    throw new Error(
      `Invalid or unsupported date format: "${dateStr}". ` +
      `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
      `Example: "2024-12-25 14:30:00"`
    );
  }
}

/**
 * Parses a date string in various formats and returns a formatted date string
 * suitable for AppleScript with locale-independent English month names
 * 
 * @param dateStr - Date string in standard format (YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, or ISO 8601)
 * @returns Formatted date string in English locale: "D MMMM YYYY" for date-only, "D MMMM YYYY HH:mm:ss" (24h) or "D MMMM YYYY h:mm:ss A" (12h) for datetime
 * @throws Error if the date format is invalid or unsupported
 * 
 * @example
 * ```typescript
 * parseDate('2024-12-25') // Returns: "25 December 2024" (date-only)
 * parseDate('2024-12-25 18:30:00') // Returns: "25 December 2024 6:30:00 PM" (12h system)
 * parseDate('2024-12-25 18:30:00') // Returns: "25 December 2024 18:30:00" (24h system)
 * ```
 */
export function parseDate(dateStr: string): string {
  try {
    const isDateOnly = isDateOnlyFormat(dateStr);
    return formatParsedDate(dateStr, isDateOnly);
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw error; // Re-throw the formatted error from formatParsedDate
  }
} 