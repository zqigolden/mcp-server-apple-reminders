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
  'read',
  'create', 
  'update',
  'delete',
  'bulk_create',
  'bulk_update',
  'bulk_delete',
] as const;

const LIST_ACTIONS: readonly ListAction[] = ['read', 'create', 'update', 'delete'] as const;

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
      'Structured reminder manager. Always provide an "action" (read | create | update | delete | bulk_create | bulk_update | bulk_delete) and only include fields documented for that action. Date strings must use YYYY-MM-DD or YYYY-MM-DD HH:mm:ss. Extra properties are rejected.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: REMINDER_ACTIONS,
          description: 'Required operation keyword. Must equal one of the enumerated reminder actions.',
        },

        // List operation parameters
        filterList: {
          type: 'string',
          description: 'Filter read results to reminders whose list name matches this value (case-sensitive).',
          minLength: 1,
          maxLength: 100,
        },
        showCompleted: {
          type: 'boolean',
          description: 'Include reminders already marked completed when action=read.',
          default: false,
        },
        search: {
          type: 'string',
          description: 'Substring matcher applied to reminder title and note fields for action=read.',
          maxLength: 100,
        },
        dueWithin: {
          type: 'string',
          enum: DUE_WITHIN_OPTIONS,
          description: 'Restrict read results to the specified due-date bucket (today|tomorrow|this-week|overdue|no-date).',
        },

        // Single item operation parameters
        title: {
          type: 'string',
          description: 'Reminder title. Required for create/update/delete and used to locate the target reminder.',
          minLength: 1,
          maxLength: 200,
        },
        newTitle: {
          type: 'string',
          description: 'Replacement title when action=update.',
          minLength: 1,
          maxLength: 200,
        },
        dueDate: {
          type: 'string',
          description: 'Due date or timestamp string. Accepts YYYY-MM-DD or YYYY-MM-DD HH:mm:ss.',
          pattern: '^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$',
        },
        note: {
          type: 'string',
          description: 'Reminder note/body text.',
          maxLength: 2000,
        },
        url: {
          type: 'string',
          description: 'Absolute URL to store with the reminder.',
          format: 'uri',
          maxLength: 500,
        },
        completed: {
          type: 'boolean',
          description: 'Set completion flag when action=update.',
        },
        targetList: {
          type: 'string',
          description: 'Name of the destination list for create/update. Helps disambiguate duplicates.',
          minLength: 1,
          maxLength: 100,
        },

        // Bulk operation parameters
        items: {
          type: 'array',
          description: 'Payload for bulk_create: array of reminder definitions.',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                minLength: 1,
                maxLength: 200,
              },
              dueDate: {
                type: 'string',
                pattern: '^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$',
              },
              note: {
                type: 'string',
                maxLength: 2000,
              },
              url: {
                type: 'string',
                format: 'uri',
                maxLength: 500,
              },
              targetList: {
                type: 'string',
                minLength: 1,
                maxLength: 100,
              },
            },
            required: ['title'],
          },
        },
        criteria: {
          type: 'object',
          description: 'Selection filters applied for bulk_update or bulk_delete.',
          properties: {
            search: {
              type: 'string',
              maxLength: 100,
            },
            dueWithin: {
              type: 'string',
              enum: DUE_WITHIN_OPTIONS,
            },
            completed: {
              type: 'boolean',
            },
            sourceList: {
              type: 'string',
              maxLength: 100,
            },
          },
        },
        updates: {
          type: 'object',
          description: 'Fields applied to each reminder matched by criteria during bulk_update.',
          properties: {
            newTitle: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
            },
            dueDate: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}(\\s\\d{2}:\\d{2}:\\d{2})?$',
            },
            note: {
              type: 'string',
              maxLength: 2000,
            },
            url: {
              type: 'string',
              format: 'uri',
              maxLength: 500,
            },
            completed: {
              type: 'boolean',
            },
            targetList: {
              type: 'string',
              minLength: 1,
              maxLength: 100,
            },
          },
        },
        organizeBy: {
          type: 'string',
          enum: ORGANIZE_STRATEGIES,
          description: 'Optional grouping strategy for bulk_update reorganizations (priority|due_date|category|completion_status).',
        },
        createLists: {
          type: 'boolean',
          description: 'Allow bulk operations to create missing lists referenced in items/updates.targetList.',
          default: true,
        },
      },
      required: ['action'],
      additionalProperties: false,
      dependentSchemas: {
        action: {
          oneOf: [
            // Read action - no additional requirements
            {
              properties: {
                action: { const: 'read' },
              },
            },
            // Create action requirements
            {
              properties: {
                action: { const: 'create' },
              },
              required: ['title'],
            },
            // Update action requirements
            {
              properties: {
                action: { const: 'update' },
              },
              required: ['title'],
            },
            // Delete action requirements
            {
              properties: {
                action: { const: 'delete' },
              },
              required: ['title'],
            },
            // Bulk create action requirements
            {
              properties: {
                action: { const: 'bulk_create' },
              },
              required: ['items'],
            },
            // Bulk update action requirements
            {
              properties: {
                action: { const: 'bulk_update' },
              },
              required: ['criteria', 'updates'],
            },
            // Bulk delete action requirements
            {
              properties: {
                action: { const: 'bulk_delete' },
              },
              required: ['criteria'],
            },
          ],
        },
      },
    },
  },
  {
    name: 'lists',
    description:
      'Reminder list maintenance tool. Provide an "action" of read | create | update | delete and only the fields required for that action. Name fields must be 1-100 characters; unexpected properties cause validation errors.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: LIST_ACTIONS,
          description: 'Required list operation keyword (read|create|update|delete).',
        },
        name: {
          type: 'string',
          description: 'List name used as target. Required for create, update, and delete.',
          minLength: 1,
          maxLength: 100,
        },
        newName: {
          type: 'string',
          description: 'Replacement list name when action=update.',
          minLength: 1,
          maxLength: 100,
        },
      },
      required: ['action'],
      additionalProperties: false,
      oneOf: [
        // Read action - no additional requirements
        {
          properties: {
            action: { const: 'read' },
          },
          additionalProperties: true,
        },
        // Create action requirements for lists
        {
          properties: {
            action: { const: 'create' },
          },
          required: ['name'],
        },
        // Update action requirements for lists
        {
          properties: {
            action: { const: 'update' },
          },
          required: ['name', 'newName'],
        },
        // Delete action requirements for lists
        {
          properties: {
            action: { const: 'delete' },
          },
          required: ['name'],
        },
      ],
    },
  },
];
