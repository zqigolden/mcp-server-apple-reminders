/**
 * tools/handlers.ts
 * Implementation of tool handlers for Apple Reminders operations
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createRemindersScript, executeAppleScript } from "../utils/applescript.js";
import { parseDate } from "../utils/date.js";
import { debugLog } from "../utils/logger.js";
import { remindersManager } from "../utils/reminders.js";

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
 * Lists all reminder lists
 * @returns Result of the operation with the list of reminder lists in JSON format
 */
export async function handleListReminderLists(): Promise<CallToolResult> {
  try {
    // Use the Swift-based reminders manager
    const { lists } = await remindersManager.getReminders();
    
    // Format the lists as JSON
    const listsJson = JSON.stringify({
      lists: lists.map(list => ({
        id: list.id,
        title: list.title
      })),
      total: lists.length
    }, null, 2);
    
    return {
      content: [
        {
          type: "text",
          text: listsJson,
        },
      ],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: `Failed to list reminder lists: ${(error as Error).message}`,
            isError: true
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Lists reminders from a specific list or all reminders
 * @param args - Arguments for listing reminders
 * @returns Result of the operation with the list of reminders in JSON format
 */
export async function handleListReminders(args: any): Promise<CallToolResult> {
  try {
    const showCompleted = args.showCompleted === true;
    const { reminders } = await remindersManager.getReminders(showCompleted);
    
    // Filter reminders
    const filteredReminders = reminders
      .filter(r => showCompleted || !r.isCompleted)
      .filter(r => !args.list || r.list === args.list)
      .map(r => ({
        title: r.title,
        list: r.list,
        isCompleted: r.isCompleted === true,
        dueDate: r.dueDate || null,
        notes: r.notes || null
      }));

    // Create response object
    const response = {
      reminders: filteredReminders,
      total: filteredReminders.length,
      filter: {
        list: args.list || 'all',
        showCompleted
      }
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(response, null, 2)
      }],
      isError: false
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: `Failed to list reminders: ${(error as Error).message}`,
          isError: true
        })
      }],
      isError: true
    };
  }
}