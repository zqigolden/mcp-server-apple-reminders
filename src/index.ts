#!/usr/bin/env node
/**
 * index.ts
 * Entry point for the Apple Reminders MCP server
 */

import { startServer } from "./server/server.js";
import { debugLog } from "./utils/logger.js";

// Server configuration
const SERVER_CONFIG = {
  name: "mcp-server-apple-reminders",
  version: "1.0.0",
};

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    await startServer(SERVER_CONFIG);
  } catch (error) {
    debugLog("Unhandled error:", error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error("Critical error:", error);
  process.exit(1);
}); 