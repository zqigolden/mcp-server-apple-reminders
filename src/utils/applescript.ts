/**
 * applescript.ts
 * Utilities for interacting with AppleScript on macOS
 */

import { execSync } from "child_process";
import { debugLog } from "./logger.js";

/**
 * Executes an AppleScript command and returns the result
 * @param script - AppleScript code to execute
 * @returns The trimmed output of the AppleScript execution
 * @throws Error if the AppleScript execution fails
 */
export function executeAppleScript(script: string): string {
  try {
    return execSync(`osascript -e '${script}'`).toString().trim();
  } catch (error) {
    debugLog("AppleScript execution error:", error);
    throw error;
  }
}

/**
 * Creates an AppleScript block with tell application "Reminders"
 * @param scriptBody - The body of the script to include inside the tell block
 * @returns Complete AppleScript with tell application wrapper
 */
export function createRemindersScript(scriptBody: string): string {
  return `tell application "Reminders"\n${scriptBody}\nend tell`;
} 