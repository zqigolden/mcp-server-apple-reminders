#!/usr/bin/env node
/**
 * index.ts
 * Entry point for the Apple Reminders MCP server
 */

import { startServer } from "./server/server.js";
import { debugLog } from "./utils/logger.js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

function getModulePaths() {
  try {
    const metaUrl = Function('return import.meta.url')();
    const __filename = fileURLToPath(metaUrl);
    const __dirname = dirname(__filename);
    return { __filename, __dirname };
  } catch {
    return { __filename: '', __dirname: '' };
  }
}

const { __dirname } = getModulePaths();

// 自动向上查找包含 package.json 的目录
const __filename = fileURLToPath(import.meta.url);
let projectRoot = dirname(__filename);
const maxDepth = 10;
let depth = 0;
while (!existsSync(join(projectRoot, "package.json")) && depth < maxDepth) {
  const parent = dirname(projectRoot);
  if (parent === projectRoot) break;
  projectRoot = parent;
  depth++;
}

const packageJson = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf-8")
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