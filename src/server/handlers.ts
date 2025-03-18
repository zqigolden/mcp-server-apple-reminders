/**
 * server/handlers.ts
 * Request handlers for the MCP server
 */

import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOLS, handleToolCall } from "../tools/index.js";
import { createRemindersScript, executeAppleScript } from "../utils/applescript.js";

/**
 * Registers all request handlers for the MCP server
 * @param server - The MCP server instance
 */
export function registerHandlers(server: Server): void {
  // Handler for listing available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "reminders://lists",
        mimeType: "text/plain",
        name: "Available Reminder Lists",
      },
    ],
  }));

  // Handler for reading a resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri.toString();

    if (uri === "reminders://lists") {
      const scriptBody = `
        set listNames to {}
        repeat with l in lists
          set end of listNames to name of l
        end repeat
        return listNames
      `;
      const script = createRemindersScript(scriptBody);
      const lists = executeAppleScript(script);
      
      // Parse the lists into JSON format
      const listsArray = lists.split(',').map(list => list.trim());
      const jsonResponse = JSON.stringify({
        lists: listsArray,
        total: listsArray.length
      });
      
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: jsonResponse,
          },
        ],
      };
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  // Handler for listing available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handler for calling a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleToolCall(request.params.name, request.params.arguments ?? {})
  );
} 