/**
 * types/index.ts
 * Type definitions for the Apple Reminders MCP server
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Reminder item interface
 */
export interface Reminder {
  title: string;
  dueDate?: string;
  notes?: string;
  list: string;
  isCompleted: boolean;
}

/**
 * Reminder list interface
 */
export interface ReminderList {
  id: number;
  title: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  name: string;
  version: string;
}

/**
 * Result of a reminder operation
 */
export interface ReminderResult {
  message: string;
  success: boolean;
}

/**
 * Tool argument types
 */
export interface RemindersToolArgs {
  action: 'list' | 'create' | 'update' | 'delete' | 'move' | 'organize';
  list?: string;
  showCompleted?: boolean;
  search?: string;
  dueWithin?: 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'no-date';
  title?: string;
  newTitle?: string;
  dueDate?: string;
  note?: string;
  url?: string;
  completed?: boolean;
  fromList?: string;
  toList?: string;
  strategy?: 'priority' | 'due_date' | 'category' | 'completion_status';
  sourceList?: string;
  createLists?: boolean;
  batchOperation?: {
    enabled: boolean;
    strategy?: 'priority' | 'due_date' | 'category' | 'completion_status';
    sourceList?: string;
    createLists?: boolean;
    filter?: {
      completed?: boolean;
      search?: string;
      dueWithin?: string;
    };
  };
}

export interface ListsToolArgs {
  action: 'list' | 'create';
  name?: string;
}

/**
 * Tool handler function signature
 */
export type ToolHandler = (
  args: RemindersToolArgs | ListsToolArgs,
) => Promise<CallToolResult>;

/**
 * Resource definitions
 */
export interface Resource {
  uri: string;
  mimeType: string;
  name: string;
}
