#!/usr/bin/env node
/**
 * index.ts
 * Entry point for the Apple Reminders MCP server
 */

import { startServer } from "./server/server.js";
import { debugLog } from "./utils/logger.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Read package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);

// Server configuration
const SERVER_CONFIG = {
  name: packageJson.name,
  version: packageJson.version,
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