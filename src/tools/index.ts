/**
 * tools/index.ts
 * Exports tool definitions and handler functions
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { debugLog } from "../utils/logger.js";
import { TOOLS } from "./definitions.js";
import {
  handleCreateReminder,
  handleListReminderLists,
  handleListReminders,
  handleUpdateReminder,
  handleDeleteReminder,
  handleMoveReminder,
  handleCreateReminderList
} from "./handlers.js";

/**
 * Routes tool calls to the appropriate handler based on the tool name
 * @param name - Name of the tool to call
 * @param args - Arguments for the tool
 * @returns Result of the tool call
 */
export async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
  debugLog(`Handling tool call: ${name} with args:`, args);

  switch (name) {
    case "create_reminder":
      return handleCreateReminder(args);
    
    case "list_reminders":
      return handleListReminders(args);
    
    case "list_reminder_lists":
      return handleListReminderLists(args);
    
    case "update_reminder":
      return handleUpdateReminder(args);
    
    case "delete_reminder":
      return handleDeleteReminder(args);
    
    case "move_reminder":
      return handleMoveReminder(args);
    
    
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
}

export { TOOLS };
