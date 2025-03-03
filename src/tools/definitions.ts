/**
 * tools/definitions.ts
 * Defines the MCP tools available in the Apple Reminders server
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Available MCP tools for Apple Reminders
 */
export const TOOLS: Tool[] = [
  {
    name: "create_reminder",
    description: "Create a new reminder with title and optional due date",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the reminder" },
        dueDate: {
          type: "string",
          description:
            "Optional due date in format 'YYYY-MM-DD HH:mm:ss' or natural language like 'tomorrow at 3pm'",
        },
        list: {
          type: "string",
          description: "Optional name of the reminders list to add to",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_reminders",
    description: "List all reminders or reminders from a specific list",
    inputSchema: {
      type: "object",
      properties: {
        list: {
          type: "string",
          description: "Optional name of the reminders list to show",
        },
      },
    },
  },
  {
    name: "list_reminder_lists",
    description: "List all reminder lists",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
]; 