/**
 * server/server.ts
 * Server configuration and startup logic
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ServerConfig } from "../types/index.js";
import { debugLog, logError } from "../utils/logger.js";
import { registerHandlers } from "./handlers.js";

/**
 * Creates and configures an MCP server instance
 * @param config - Server configuration
 * @returns Configured server instance
 */
export function createServer(config: ServerConfig): Server {
  const server = new Server(
    {
      name: config.name,
      version: config.version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  // Register request handlers
  registerHandlers(server);

  return server;
}

/**
 * Starts the MCP server
 * @param config - Server configuration
 * @returns A promise that resolves when the server starts
 */
export async function startServer(config: ServerConfig): Promise<void> {
  try {
    debugLog(`Starting ${config.name} v${config.version}...`);
    
    const server = createServer(config);
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    debugLog("Server started successfully");
  } catch (error) {
    logError("Failed to start server", error);
    process.exit(1);
  }
} 