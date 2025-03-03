/**
 * types/index.ts
 * Type definitions for the Apple Reminders MCP server
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

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
 * Tool handler function signature
 */
export type ToolHandler = (args: any) => Promise<CallToolResult>;

/**
 * Resource definitions
 */
export interface Resource {
  uri: string;
  mimeType: string;
  name: string;
} 