/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createRemindersScript, executeAppleScript } from "../utils/applescript.js";
import { parseDate } from "../utils/date.js";
import { debugLog } from "../utils/logger.js";

/**
 * Creates a new reminder
 * @param args - Arguments for creating a reminder
 * @returns Result of the operation
 */
export async function handleCreateReminder(args: any): Promise<CallToolResult> {
  try {
    // Build the script body
    let scriptBody = '';

    // If list is specified, target that list
    if (args.list) {
      scriptBody += `set targetList to list "${args.list}"\n`;
    } else {
      scriptBody += "set targetList to default list\n";
    }

    scriptBody += "make new reminder at end of targetList\n";
    scriptBody += `set name of result to "${args.title}"\n`;

    // Add due date if specified
    if (args.dueDate) {
      const parsedDate = parseDate(args.dueDate);
      debugLog("Parsed date:", parsedDate);
      scriptBody += `set due date of result to date "${parsedDate}"\n`;
    }

    // Execute the script
    const script = createRemindersScript(scriptBody);
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    return {
      content: [
        {
          type: "text",
          text: `Successfully created reminder: ${args.title}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to create reminder: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Lists reminders from a specific list or the default list
 * @param args - Arguments for listing reminders
 * @returns Result of the operation with the list of reminders
 */
export async function handleListReminders(args: any): Promise<CallToolResult> {
  try {
    let scriptBody = '';

    if (args.list) {
      scriptBody += `set reminderList to list "${args.list}"\n`;
    } else {
      scriptBody += "set reminderList to default list\n";
    }

    scriptBody += "set reminderNames to {}\n";
    scriptBody += "repeat with r in (reminders in reminderList whose completed is false)\n";
    scriptBody += "set end of reminderNames to {name:name of r, due:due date of r}\n";
    scriptBody += "end repeat\n";
    scriptBody += "return reminderNames\n";

    const script = createRemindersScript(scriptBody);
    const result = executeAppleScript(script);

    return {
      content: [
        {
          type: "text",
          text: `Active reminders:\n${result}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to list reminders: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Lists all reminder lists
 * @returns Result of the operation with the list of reminder lists
 */
export async function handleListReminderLists(): Promise<CallToolResult> {
  try {
    const scriptBody = `
      set listNames to {}
      repeat with l in lists
        set end of listNames to name of l
      end repeat
      return listNames
    `;

    const script = createRemindersScript(scriptBody);
    const result = executeAppleScript(script);

    return {
      content: [
        {
          type: "text",
          text: `Available reminder lists:\n${result}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to list reminder lists: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
} 