/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import moment from "moment";
import { debugLog } from "./logger.js";
import { execSync } from "child_process";

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

    // Check if system uses 24-hour time
    let use24Hour = false;
    try {
        const result = execSync('defaults read -g AppleICUForce24HourTime').toString().trim();
        use24Hour = result === '1';
    } catch (err) {
        debugLog("Could not determine 24-hour setting, defaulting to 12-hour format.");
        use24Hour = false;
    }

    let formattedDate;
    if (use24Hour) {
        // Format as 24-hour time
        formattedDate = parsedDate.format("M/D/YYYY HH:mm:ss");
        debugLog("Parsed date (24-hour):", formattedDate);
    } else {
        // Format as 12-hour time with AM/PM
        const hour = parsedDate.hour();
        const amPm = hour < 12 ? 'AM' : 'PM';
        formattedDate = parsedDate.format("M/D/YYYY h:mm:ss") + ` ${amPm}`;
        debugLog("Parsed date (12-hour):", formattedDate);
    }
    return formattedDate;
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw new Error(`Invalid date format: ${dateStr}`);
  }
} 