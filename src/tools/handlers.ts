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

    // Build properties object for the reminder
    scriptBody += "set reminderProps to {name:\"" + args.title + "\"";
    
    // Add due date if specified
    if (args.dueDate) {
      const parsedDate = parseDate(args.dueDate);
      debugLog("Parsed date:", parsedDate);
      scriptBody += `, due date:date "${parsedDate}"`;
    }
    
    // Add note if specified
    if (args.note) {
      scriptBody += `, body:"${args.note}"`;
    }
    
    scriptBody += "}\n";
    
    // Create reminder with all properties at once
    scriptBody += "make new reminder at end of targetList with properties reminderProps\n";

    // Execute the script
    const script = createRemindersScript(scriptBody);
    debugLog("Running AppleScript:", script);
    executeAppleScript(script);

    return {
      content: [
        {
          type: "text",
          text: `Successfully created reminder: ${args.title}${args.note ? ' with notes' : ''}`,
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
    const listName = args.list || "Reminders";
    const scriptBody = `
      tell application "Reminders"
        set theList to first list whose name is "${listName}"
        set theReminders to {}
        set allReminders to (every reminder of theList whose completed is false)
        repeat with r in allReminders
          set end of theReminders to {|name|:name of r}
        end repeat
        return theReminders
      end tell
    `;

    const result = executeAppleScript(scriptBody);
    const reminders = result.split(", ").filter(r => r.trim() !== "");
    const formattedResult = reminders.length > 0 
      ? reminders.map(r => `- ${r.replace(/[{}]/g, "").trim()}`).join("\n")
      : "No active reminders found";
    
    return {
      content: [
        {
          type: "text",
          text: `Active reminders in "${listName}" list:\n${formattedResult}`,
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