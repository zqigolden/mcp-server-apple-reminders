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
    // First try parsing as exact date
    let parsedDate = moment(dateStr);

    // If not valid, try parsing as natural language
    if (!parsedDate.isValid()) {
      parsedDate = moment(new Date(dateStr));
    }

    // If still not valid, throw error
    if (!parsedDate.isValid()) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Format date for AppleScript in a simpler format
    return parsedDate.format("M/D/YYYY H:mm:ss");
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw new Error(`Invalid date format: ${dateStr}`);
  }
} 