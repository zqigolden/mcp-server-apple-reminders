/**
 * tools/definitions.ts
 * MCP tool definitions for Apple Reminders server with comprehensive type safety and validation
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Enum definitions for better type safety and consistency
 */
const REMINDER_ACTIONS = ["list", "create", "update", "delete", "move", "organize"] as const;
const LIST_ACTIONS = ["list", "create"] as const;
const DUE_WITHIN_OPTIONS = ["today", "tomorrow", "this-week", "overdue", "no-date"] as const;
const ORGANIZE_STRATEGIES = ["priority", "due_date", "category", "completion_status"] as const;

/**
 * Optimized tool definitions following MCP best practices
 */
export const TOOLS: Tool[] = [
  {
    name: "reminders",
    description: "Comprehensive reminder management tool with action-based operations. Supports listing, creating, updating, deleting, moving, and organizing reminders across different lists.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: REMINDER_ACTIONS,
          description: "Operation to perform on reminders",
        },
        
        // List operation parameters
        list: {
          type: "string",
          description: "Name of the reminder list (REQUIRED for 'list' action). Examples: 'Reminders', 'Work', 'Personal', 'Shopping'",
          minLength: 1,
          maxLength: 100,
        },
        showCompleted: {
          type: "boolean",
          description: "Include completed reminders in results (list action only)",
          default: false,
        },
        search: {
          type: "string",
          description: "Search term to filter reminders by title or content",
          maxLength: 100,
        },
        dueWithin: {
          type: "string",
          enum: DUE_WITHIN_OPTIONS,
          description: "Filter reminders by due date range",
        },
        
        // Create/Update operation parameters
        title: {
          type: "string",
          description: "Reminder title (REQUIRED for create, update, delete, move actions)",
          minLength: 1,
          maxLength: 200,
        },
        newTitle: {
          type: "string",
          description: "New title for reminder (update action only)",
          minLength: 1,
          maxLength: 200,
        },
        dueDate: {
          type: "string",
          description: "Due date in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'",
          pattern: "^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$",
        },
        note: {
          type: "string",
          description: "Additional notes or description for the reminder",
          maxLength: 2000,
        },
        url: {
          type: "string",
          description: "URL to associate with the reminder",
          format: "uri",
          maxLength: 500,
        },
        completed: {
          type: "boolean",
          description: "Mark reminder as completed (update action only)",
        },
        
        // Move operation parameters
        fromList: {
          type: "string",
          description: "Source list name (REQUIRED for move action)",
          minLength: 1,
          maxLength: 100,
        },
        toList: {
          type: "string",
          description: "Destination list name (REQUIRED for move action)",
          minLength: 1,
          maxLength: 100,
        },
        
        // Organize operation parameters
        strategy: {
          type: "string",
          enum: ORGANIZE_STRATEGIES,
          description: "Strategy for organizing reminders into lists",
        },
        sourceList: {
          type: "string",
          description: "Source list to organize from (organize action only)",
          maxLength: 100,
        },
        createLists: {
          type: "boolean",
          description: "Create new lists automatically during organization",
          default: true,
        },
      },
      required: ["action"],
      additionalProperties: false,
      allOf: [
        // List action - no additional requirements (supports intelligent defaults)
        // The handler will automatically select appropriate list if not specified
        // Create action requirements  
        {
          if: {
            properties: { action: { const: "create" } }
          },
          then: {
            required: ["title"]
          }
        },
        // Update action requirements
        {
          if: {
            properties: { action: { const: "update" } }
          },
          then: {
            required: ["title"]
          }
        },
        // Delete action requirements
        {
          if: {
            properties: { action: { const: "delete" } }
          },
          then: {
            required: ["title"]
          }
        },
        // Move action requirements
        {
          if: {
            properties: { action: { const: "move" } }
          },
          then: {
            required: ["title", "fromList", "toList"]
          }
        },
        // Organize action requirements
        {
          if: {
            properties: { action: { const: "organize" } }
          },
          then: {
            required: ["strategy"]
          }
        }
      ],
    },
  },
  {
    name: "lists",
    description: "Manage reminder lists - view existing lists or create new ones for organizing reminders",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: LIST_ACTIONS,
          description: "Operation to perform on reminder lists",
        },
        name: {
          type: "string",
          description: "Name for new reminder list (REQUIRED for create action)",
          minLength: 1,
          maxLength: 100,
          pattern: "^[^\\u0000-\\u0009\\u000B-\\u001F\\u007F<>\\\\\\{\\}\\|\\^`]*$",
        },
      },
      required: ["action"],
      additionalProperties: false,
      allOf: [
        // Create action requirements for lists
        {
          if: {
            properties: { action: { const: "create" } }
          },
          then: {
            required: ["name"]
          }
        }
      ],
    },
  },
];