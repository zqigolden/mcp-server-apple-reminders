/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";
import { execSync } from "child_process";

// Cache for the system's 24-hour time preference (macOS specific)
let use24HourTimeCached: boolean | undefined;

// Date format constants for AppleScript compatibility
const DATE_ONLY_FORMAT = "MMMM D, YYYY" as const;
const DATETIME_FORMAT_12_HOUR = "MMMM D, YYYY h:mm:ss A" as const;
const DATETIME_FORMAT_24_HOUR = "MMMM D, YYYY HH:mm:ss" as const;

/**
 * Clears the cached 24-hour time preference (for testing purposes only)
 * @internal This function should only be used in test environments
 */
export function clearTimePreferenceCache(): void {
    if (process.env.NODE_ENV !== 'test') {
        console.warn('clearTimePreferenceCache should only be used in test environments');
    }
    use24HourTimeCached = undefined;
}

/**
 * Determines if the system uses 24-hour time by reading a macOS default setting.
 * Caches the result for subsequent calls. Defaults to 12-hour on error or non-macOS.
 * @returns boolean - true if system uses 24-hour time, false otherwise.
 */
function determineSystem24HourTime(): boolean {
    // Cache the result after the first successful determination
    if (use24HourTimeCached === undefined) {
        try {
            // NOTE: This command is macOS specific. It will fail on other platforms.
            const result = execSync('defaults read -g AppleICUForce24HourTime').toString().trim();
            use24HourTimeCached = result === '1';
            debugLog(`System 24-hour time determined: ${use24HourTimeCached ? '24-hour' : '12-hour'}`);
        } catch (error) {
            debugLog(`Could not determine 24-hour setting using 'defaults' command. ` +
                     `Error: ${error}. Defaulting to 12-hour format.`);
            use24HourTimeCached = false; // Default to 12-hour on failure
        }
    }
    return use24HourTimeCached;
}

/**
 * Checks if a date string represents a date-only format (YYYY-MM-DD without time)
 * @param dateStr - Date string to check
 * @returns true if the string is in date-only format, false otherwise
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

    const englishMoment = parsedDate.locale('en');
    
    if (isDateOnly) {
      const formatted = englishMoment.format(DATE_ONLY_FORMAT);
      debugLog("Parsed date (date-only):", formatted);
      return formatted;
    }
    
    const use24Hour = determineSystem24HourTime();
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