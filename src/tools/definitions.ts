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
    description: "Create a new reminder with title and optional properties",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the reminder" },
        dueDate: {
          type: "string",
          description:
            "Optional due date in format 'YYYY-MM-DD HH:mm:ss' (e.g., '2025-03-12 10:00:00')",
        },
        list: {
          type: "string",
          description: "Optional name of the reminders list to add to",
        },
        note: {
          type: "string",
          description: "Optional note text to attach to the reminder",
        },
        url: {
          type: "string",
          description: "Optional URL to attach to the reminder",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_reminders",
    description: "List all reminders or reminders from a specific list with optional filtering",
    inputSchema: {
      type: "object",
      properties: {
        list: {
          type: "string",
          description: "Optional name of the reminders list to show",
        },
        showCompleted: {
          type: "boolean",
          description: "Whether to show completed reminders (default: false)",
          default: false
        },
        search: {
          type: "string",
          description: "Search for reminders containing this text in title or notes",
        },
        dueWithin: {
          type: "string",
          enum: ["today", "tomorrow", "this-week", "overdue", "no-date"],
          description: "Filter by due date range",
        },
      },
    },
  },
  {
    name: "update_reminder",
    description: "Update an existing reminder by title. Note: If multiple reminders have the same title, only the first one found will be updated.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Current title of the reminder to update",
        },
        newTitle: {
          type: "string",
          description: "New title for the reminder (optional)",
        },
        dueDate: {
          type: "string",
          description: "New due date in format 'YYYY-MM-DD HH:mm:ss' (optional)",
        },
        note: {
          type: "string",
          description: "New note text (optional)",
        },
        completed: {
          type: "boolean",
          description: "Mark reminder as completed/uncompleted (optional)",
        },
        list: {
          type: "string",
          description: "Name of the list containing the reminder (recommended for accuracy)",
        },
        url: {
          type: "string",
          description: "New URL to attach to the reminder (optional)",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "delete_reminder",
    description: "Delete a reminder by title",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the reminder to delete",
        },
        list: {
          type: "string",
          description: "Optional name of the list containing the reminder (recommended for accuracy)",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "move_reminder",
    description: "Move a reminder from one list to another",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the reminder to move",
        },
        fromList: {
          type: "string",
          description: "Name of the list containing the reminder",
        },
        toList: {
          type: "string",
          description: "Name of the destination list",
        },
      },
      required: ["title", "fromList", "toList"],
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