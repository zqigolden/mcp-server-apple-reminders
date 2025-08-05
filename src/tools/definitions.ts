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
    description: "Update an existing reminder by title, or organize/batch update multiple reminders. Note: If multiple reminders have the same title, only the first one found will be updated.",
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
        // Batch/organization options
        batchOperation: {
          type: "object",
          description: "Batch operation settings for organizing multiple reminders",
          properties: {
            enabled: {
              type: "boolean",
              description: "Enable batch mode for organizing reminders",
            },
            strategy: {
              type: "string",
              enum: ["priority", "due_date", "category", "completion_status"],
              description: "Organization strategy for batch operations",
            },
            sourceList: {
              type: "string",
              description: "Source list to organize from (optional, defaults to all lists)",
            },
            createLists: {
              type: "boolean",
              description: "Whether to create new lists for organization (default: true)",
            },
            filter: {
              type: "object",
              description: "Filter criteria for batch operations",
              properties: {
                completed: {
                  type: "boolean",
                  description: "Filter by completion status",
                },
                search: {
                  type: "string", 
                  description: "Filter by text in title or notes",
                },
                dueWithin: {
                  type: "string",
                  enum: ["today", "tomorrow", "this-week", "overdue", "no-date"],
                  description: "Filter by due date range",
                },
              },
            },
          },
        },
      },
      anyOf: [
        { required: ["title"] },
        { 
          required: ["batchOperation"],
          properties: {
            batchOperation: {
              properties: {
                enabled: { const: true }
              }
            }
          }
        }
      ],
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
    description: "List all reminder lists, or create a new reminder list",
    inputSchema: {
      type: "object",
      properties: {
        createNew: {
          type: "object",
          description: "Create a new reminder list",
          properties: {
            name: {
              type: "string",
              description: "Name of the new reminder list to create",
            },
          },
          required: ["name"],
        },
      },
    },
  },
]; 