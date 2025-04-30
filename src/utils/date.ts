/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";

/**
 * Parses a date string in various formats and returns a formatted date string
 * suitable for AppleScript
 * 
 * @param dateStr - Date string in standard format or natural language
 * @returns Formatted date string (M/D/YYYY H:mm:ss)
 * @throws Error if the date format is invalid
 */
export function parseDate(dateStr: string): string {
  try {
    // Try parsing with moment, expecting 'YYYY-MM-DD HH:mm:ss' or other moment-parsable formats
    const parsedDate = moment(dateStr, [
      "YYYY-MM-DD HH:mm:ss", // Explicitly handle the documented format first
      moment.ISO_8601,       // Handle ISO formats
      "YYYY-MM-DD",          // Handle date-only format
    ], true); // Use strict parsing

    // If not valid, throw error
    if (!parsedDate.isValid()) {
      throw new Error(`Invalid or unsupported date format: ${dateStr}. Please use 'YYYY-MM-DD HH:mm:ss'.`);
    }

    // Format date for AppleScript
    return parsedDate.format("M/D/YYYY HH:mm:ss");
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw new Error(`Invalid date format: ${dateStr}`);
  }
} 