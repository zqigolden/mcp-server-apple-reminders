/**
 * date.ts
 * Utilities for parsing and formatting dates
 */

import { spawnSync } from 'node:child_process';
import moment from 'moment';
import { debugLog } from './logger.js';

// Date format constants for AppleScript compatibility
const FALLBACK_DATE_FORMAT_12_HOUR = 'MMMM D, YYYY' as const;
const FALLBACK_DATE_FORMAT_24_HOUR = 'D MMMM YYYY' as const;
const FALLBACK_TIME_FORMAT_12_HOUR = 'h:mm:ss A' as const;
const FALLBACK_TIME_FORMAT_24_HOUR = 'HH:mm:ss' as const;

const APPLESCRIPT_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Time preference management using functional composition
 */
type TimePreferenceState = {
  cache?: boolean;
};

const timePreferenceState: TimePreferenceState = {};

/**
 * Retrieves the system locale for localized date formatting.
 * Falls back to 'en' if detection fails.
 */
function getSystemLocale(): string {
  try {
    const locale =
      new Intl.DateTimeFormat().resolvedOptions().locale ?? 'en';
    return locale.replace('_', '-');
  } catch {
    return 'en';
  }
}

/**
 * Gets the 24-hour time preference with lazy initialization
 */
function get24HourPreference(): boolean {
  if (timePreferenceState.cache === undefined) {
    timePreferenceState.cache = determineTimePreference();
  }
  return timePreferenceState.cache;
}

function determineTimePreference(): boolean {
  const fallback = inferLocale24HourPreference();
  try {
    const result = safeSystemCommandSync('defaults', [
      'read',
      '-g',
      'AppleICUForce24HourTime',
    ]);
    const normalized = result.trim();
    if (normalized === '1') {
      debugLog('Time preference: 24-hour');
      return true;
    }
    if (normalized === '0') {
      debugLog(
        `Time preference from defaults: 12-hour, locale fallback indicates ${
          fallback ? '24-hour' : '12-hour'
        }`,
      );
      return fallback;
    }
    debugLog(
      `Unexpected defaults value "${normalized}", using locale fallback ${
        fallback ? '(24-hour)' : '(12-hour)'
      }`,
    );
    return fallback;
  } catch (error) {
    debugLog(
      `Using ${fallback ? '24-hour' : '12-hour'} default: ${
        (error as Error).message
      }`,
    );
    return fallback;
  }
}

function inferLocale24HourPreference(): boolean {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
    const options = formatter.resolvedOptions();

    if (typeof options.hour12 === 'boolean') {
      return options.hour12 === false;
    }

    const hourCycle = (options as { hourCycle?: string }).hourCycle;
    if (hourCycle) {
      return hourCycle === 'h23' || hourCycle === 'h24';
    }
  } catch {
    // Ignore errors and fall back to 12-hour preference below
  }

  return false;
}

/**
 * Clears the time preference cache (for testing)
 */
function clearTimePreferenceCache(): void {
  if (process.env.NODE_ENV === 'test') {
    timePreferenceState.cache = undefined;
  }
}

/**
 * Clear the cached system time preference for testing purposes only.
 * @internal
 */
export { clearTimePreferenceCache };

/**
 * Validates command execution for security
 */
function validateSystemCommand(command: string, args: string[]): void {
  if (command !== 'defaults' || !args.includes('AppleICUForce24HourTime')) {
    throw new Error(`Command not allowed: ${command}`);
  }
}

/**
 * Safely executes system command to read preferences with improved structure
 * @param command - Command to execute
 * @param args - Command arguments
 * @param timeout - Timeout in milliseconds
 * @returns Promise with command output
 */
function safeSystemCommandSync(
  command: string,
  args: string[],
  timeout = 5000,
): string {
  // Guard clause: validate command security
  validateSystemCommand(command, args);

  const result = spawnSync(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    encoding: 'utf8',
  });

  if (result.error) {
    throw new Error(`Process error: ${result.error.message}`);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`Command failed: ${result.stderr ?? ''}`.trim());
  }

  return (result.stdout ?? '').toString().trim();
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
  const formatted = formatDate(dateStr, isDateOnly);

  return { formatted, isDateOnly };
}

/**
 * Generates AppleScript property string for date handling
 * @param dateStr - Date string to parse
 * @param quoteFn - Function to quote AppleScript strings
 * @returns AppleScript property string for the appropriate date type
 */
export interface AppleScriptDateValue {
  prelude: string[];
  variableName: string;
  isDateOnly: boolean;
}

export function generateDateProperty(
  dateStr: string,
  variableName: string,
): AppleScriptDateValue {
  const isDateOnly = isDateOnlyFormat(dateStr);

  let parsedDate: moment.Moment;
  try {
    parsedDate = moment(
      dateStr,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
  } catch {
    throw new Error(createDateFormatErrorMessage(dateStr));
  }

  if (!parsedDate.isValid()) {
    throw new Error(createDateFormatErrorMessage(dateStr));
  }

  const year = parsedDate.year();
  const monthIndex = parsedDate.month();
  const day = parsedDate.date();
  const hour = isDateOnly ? 0 : parsedDate.hour();
  const minute = isDateOnly ? 0 : parsedDate.minute();
  const second = isDateOnly ? 0 : parsedDate.second();
  const secondsFromMidnight = hour * 3600 + minute * 60 + second;

  const monthName = APPLESCRIPT_MONTHS[monthIndex];
  const prelude = [
    `set ${variableName} to current date`,
    `set year of ${variableName} to ${year}`,
    `set month of ${variableName} to ${monthName}`,
    `set day of ${variableName} to ${day}`,
    `set time of ${variableName} to ${secondsFromMidnight}`,
  ];

  return {
    prelude,
    variableName,
    isDateOnly,
  };
}

/**
 * Creates standardized error message for date parsing
 */
function createDateFormatErrorMessage(dateStr: string): string {
  return (
    `Invalid or unsupported date format: "${dateStr}". ` +
    `Supported formats: YYYY-MM-DD HH:mm:ss, YYYY-MM-DD, ISO 8601. ` +
    `Example: "2024-12-25 14:30:00"`
  );
}

/**
 * Unified date formatting function with improved error handling
 * @param dateStr - Date string to parse
 * @param isDateOnly - Whether this is a date-only format
 * @returns Formatted date string
 * @throws Error if the date format is invalid
 */
function formatDate(dateStr: string, isDateOnly: boolean): string {
  let parsedDate: moment.Moment;
  
  try {
    parsedDate = moment(
      dateStr,
      ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601, 'YYYY-MM-DD'],
      true,
    );
  } catch {
    throw new Error(createDateFormatErrorMessage(dateStr));
  }

  // Guard clause: check if date is valid
  if (!parsedDate.isValid()) {
    throw new Error(createDateFormatErrorMessage(dateStr));
  }

  const systemLocale = getSystemLocale().toLowerCase();
  const localizedMoment = parsedDate.locale(systemLocale);
  const localeData = localizedMoment.localeData();
  const prefer24Hour = get24HourPreference();
  const dateFormat =
    localeData.longDateFormat('LL') ??
    (prefer24Hour
      ? FALLBACK_DATE_FORMAT_24_HOUR
      : FALLBACK_DATE_FORMAT_12_HOUR);

  if (isDateOnly) {
    return localizedMoment.format(dateFormat);
  }

  const localeTimeFormat = localeData.longDateFormat('LTS');
  const timeFormat = prefer24Hour
    ? FALLBACK_TIME_FORMAT_24_HOUR
    : localeTimeFormat ?? FALLBACK_TIME_FORMAT_12_HOUR;

  const formatString = `${dateFormat} ${timeFormat}`;
  return localizedMoment.format(formatString);
}

/**
 * Parses a date string and returns formatted date for AppleScript
 * @param dateStr - Date string in standard format
 * @returns Formatted date string in English locale
 * @throws Error if the date format is invalid
 */
export function parseDate(dateStr: string): string {
  const isDateOnly = isDateOnlyFormat(dateStr);
  return formatDate(dateStr, isDateOnly);
}
