/**
 * tools/definitions.ts
 * MCP tool definitions for Apple Reminders server with comprehensive type safety and validation
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import type { ReminderAction, ListAction, DueWithinOption, OrganizeStrategy } from '../types/index.js';

/**
 * Const assertions for tool schema validation
 */
const REMINDER_ACTIONS: readonly ReminderAction[] = [
  'list',
  'create', 
  'update',
  'delete',
  'move',
  'organize',
] as const;

const LIST_ACTIONS: readonly ListAction[] = ['list', 'create'] as const;

const DUE_WITHIN_OPTIONS: readonly DueWithinOption[] = [
  'today',
  'tomorrow',
  'this-week', 
  'overdue',
  'no-date',
] as const;

const ORGANIZE_STRATEGIES: readonly OrganizeStrategy[] = [
  'priority',
  'due_date',
  'category',
  'completion_status',
] as const;

/**
 * Optimized tool definitions following MCP best practices
 */
export const TOOLS: Tool[] = [
  {
    name: 'reminders',
    description:
      'Comprehensive reminder management tool with action-based operations. Supports listing, creating, updating, deleting, moving, and organizing reminders across different lists.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: REMINDER_ACTIONS,
          description: 'Operation to perform on reminders',
        },

        // List operation parameters
        list: {
          type: 'string',
          description:
            "Name of the reminder list (REQUIRED for 'list' action). Examples: 'Reminders', 'Work', 'Personal', 'Shopping'",
          minLength: 1,
          maxLength: 100,
        },
        showCompleted: {
          type: 'boolean',
          description:
            'Include completed reminders in results (list action only)',
          default: false,
        },
        search: {
          type: 'string',
          description: 'Search term to filter reminders by title or content',
          maxLength: 100,
        },
        dueWithin: {
          type: 'string',
          enum: DUE_WITHIN_OPTIONS,
          description: 'Filter reminders by due date range',
        },

        // Create/Update operation parameters
        title: {
          type: 'string',
          description:
            'Reminder title (REQUIRED for create, update, delete, move actions)',
          minLength: 1,
          maxLength: 200,
        },
        newTitle: {
          type: 'string',
          description: 'New title for reminder (update action only)',
          minLength: 1,
          maxLength: 200,
        },
        dueDate: {
          type: 'string',
          description:
            "Due date in format 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'",
          pattern: '^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$',
        },
        note: {
          type: 'string',
          description: 'Additional notes or description for the reminder',
          maxLength: 2000,
        },
        url: {
          type: 'string',
          description: 'URL to associate with the reminder',
          format: 'uri',
          maxLength: 500,
        },
        completed: {
          type: 'boolean',
          description: 'Mark reminder as completed (update action only)',
        },

        // Move operation parameters
        fromList: {
          type: 'string',
          description: 'Source list name (REQUIRED for move action)',
          minLength: 1,
          maxLength: 100,
        },
        toList: {
          type: 'string',
          description: 'Destination list name (REQUIRED for move action)',
          minLength: 1,
          maxLength: 100,
        },

        // Organize operation parameters
        strategy: {
          type: 'string',
          enum: ORGANIZE_STRATEGIES,
          description: 'Strategy for organizing reminders into lists',
        },
        sourceList: {
          type: 'string',
          description: 'Source list to organize from (organize action only)',
          maxLength: 100,
        },
        createLists: {
          type: 'boolean',
          description: 'Create new lists automatically during organization',
          default: true,
        },
      },
      required: ['action'],
      additionalProperties: false,
      oneOf: [
        // List action - no additional requirements
        {
          properties: {
            action: { const: 'list' },
          },
          additionalProperties: true,
        },
        // Create action requirements
        {
          properties: {
            action: { const: 'create' },
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
            },
          },
          required: ['action', 'title'],
          additionalProperties: true,
        },
        // Update action requirements
        {
          properties: {
            action: { const: 'update' },
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
            },
          },
          required: ['action', 'title'],
          additionalProperties: true,
        },
        // Delete action requirements
        {
          properties: {
            action: { const: 'delete' },
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
            },
          },
          required: ['action', 'title'],
          additionalProperties: true,
        },
        // Move action requirements
        {
          properties: {
            action: { const: 'move' },
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
            },
            fromList: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
            },
            toList: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
            },
          },
          required: ['action', 'title', 'fromList', 'toList'],
          additionalProperties: true,
        },
        // Organize action requirements
        {
          properties: {
            action: { const: 'organize' },
            strategy: {
              type: 'string',
              enum: ORGANIZE_STRATEGIES,
            },
          },
          required: ['action', 'strategy'],
          additionalProperties: true,
        },
      ],
    },
  },
  {
    name: 'lists',
    description:
      'Manage reminder lists - view existing lists or create new ones for organizing reminders',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: LIST_ACTIONS,
          description: 'Operation to perform on reminder lists',
        },
        name: {
          type: 'string',
          description:
            'Name for new reminder list (REQUIRED for create action)',
          minLength: 1,
          maxLength: 100,
        },
      },
      required: ['action'],
      additionalProperties: false,
      oneOf: [
        // List action - no additional requirements
        {
          properties: {
            action: { const: 'list' },
          },
          additionalProperties: true,
        },
        // Create action requirements for lists
        {
          properties: {
            action: { const: 'create' },
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
            },
          },
          required: ['action', 'name'],
          additionalProperties: true,
        },
      ],
    },
  },
];
