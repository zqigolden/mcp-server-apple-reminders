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
 * Lists reminders from a specific list or all reminders
 * @param args - Arguments for listing reminders
 * @returns Result of the operation with the list of reminders
 */
export async function handleListReminders(args: any): Promise<CallToolResult> {
  try {
    console.log('DEBUG: handleListReminders args:', args);
    
    // 确保 showCompleted 是布尔值
    const showCompleted = args.showCompleted === true;
    
    // Use the Swift-based reminders manager
    const { reminders, lists } = await remindersManager.getReminders(showCompleted);
    
    console.log('DEBUG: Total reminders from Swift:', reminders.length);
    
    // Filter reminders by completion status first, then by list
    let filteredReminders = reminders;
    
    // 使用严格的布尔值比较进行过滤
    if (!showCompleted) {
      filteredReminders = filteredReminders.filter(r => {
        const isCompleted = r.isCompleted === true;
        console.log(`DEBUG: Filtering reminder "${r.title}":
          - isCompleted: ${isCompleted}
          - Raw value: ${r.isCompleted}
          - Type: ${typeof r.isCompleted}`);
        return !isCompleted;
      });
    }
    
    // 按列表过滤
    if (args.list) {
      filteredReminders = filteredReminders.filter(r => r.list === args.list);
    }

    // Format the reminders for display
    const formattedReminders = filteredReminders.map(r => {
      let text = `- ${r.title}`;
      if (r.dueDate) {
        text += ` (Due: ${r.dueDate})`;
      }
      
      // 使用严格的布尔值比较来显示完成状态
      if (r.isCompleted === true) {
        text += " ✓";
      }
      
      return text;
    }).join("\n");

    const listName = args.list || "all lists";
    return {
      content: [
        {
          type: "text",
          text: formattedReminders || `No reminders found in ${listName}`,
        },
      ],
      isError: false,
    };
  } catch (error) {
    console.error('Error in handleListReminders:', error);
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
    // Use the Swift-based reminders manager
    const { lists } = await remindersManager.getReminders();
    
    // Format the lists for display
    const formattedLists = lists.map(list => `- ${list.title}`).join("\n");
    
    return {
      content: [
        {
          type: "text",
          text: `Available reminder lists:\n${formattedLists}`,
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