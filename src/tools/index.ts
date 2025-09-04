/**
 * tools/index.ts
 * Exports tool definitions and handler functions
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ListsToolArgs, RemindersToolArgs } from '../types/index.js';
import { MESSAGES } from '../utils/constants.js';
import { debugLog } from '../utils/logger.js';
import { TOOLS } from './definitions.js';
import {
  handleCreateReminder,
  handleCreateReminderList,
  handleDeleteReminder,
  handleListReminderLists,
  handleListReminders,
  handleMoveReminder,
  handleUpdateReminder,
} from './handlers.js';

/**
 * Routes tool calls to the appropriate handler based on the tool name
 * @param name - Name of the tool to call
 * @param args - Arguments for the tool
 * @returns Result of the tool call
 */
export async function handleToolCall(
  name: string,
  args: RemindersToolArgs | ListsToolArgs,
): Promise<CallToolResult> {
  debugLog(`Handling tool call: ${name} with args:`, args);

  switch (name) {
    case 'reminders': {
      const action = args?.action;
      switch (action) {
        case 'list':
          return handleListReminders(args);
        case 'create':
          return handleCreateReminder(args);
        case 'update':
          return handleUpdateReminder(args);
        case 'delete':
          return handleDeleteReminder(args);
        case 'move':
          return handleMoveReminder(args);
        case 'organize': {
          // Translate to batch operation for the update handler
          const batchArgs: RemindersToolArgs = {
            action: 'update',
            title: 'batch',
            batchOperation: {
              enabled: true,
              strategy: args.strategy,
              sourceList: args.sourceList,
              createLists: args.createLists,
              filter: {
                // For organize action, these fields may not be present
                // completed: args.completed,
                // search: args.search,
                // dueWithin: args.dueWithin,
              },
            },
          };
          return handleUpdateReminder(batchArgs);
        }
        default:
          return {
            content: [
              {
                type: 'text',
                text: MESSAGES.ERROR.UNKNOWN_ACTION(
                  'reminders',
                  String(action),
                ),
              },
            ],
            isError: true,
          };
      }
    }
    case 'lists': {
      const action = args?.action;
      switch (action) {
        case 'list':
          return handleListReminderLists({ action: 'list' });
        case 'create': {
          const listArgs = args as ListsToolArgs;
          if (!listArgs.name) {
            return {
              content: [{
                type: 'text',
                text: MESSAGES.ERROR.INPUT_VALIDATION_FAILED('Name is required for list creation')
              }],
              isError: true,
            };
          }
          return handleCreateReminderList({
            action: 'create',
            name: listArgs.name,
          });
        }
        default:
          return {
            content: [
              {
                type: 'text',
                text: MESSAGES.ERROR.UNKNOWN_ACTION('lists', String(action)),
              },
            ],
            isError: true,
          };
      }
    }
    default:
      return {
        content: [
          {
            type: 'text',
            text: MESSAGES.ERROR.UNKNOWN_TOOL(name),
          },
        ],
        isError: true,
      };
  }
}

export { TOOLS };
