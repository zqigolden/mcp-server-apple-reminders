#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import moment from "moment";

// Constants and configurations
const SERVER_NAME = "mcp-server-apple-reminders";
const SERVER_VERSION = "1.0.0";

// Define the tools for Reminders interaction
const TOOLS: Tool[] = [
  {
    name: "create_reminder",
    description: "Create a new reminder with title and optional due date",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the reminder" },
        dueDate: {
          type: "string",
          description:
            "Optional due date in format 'YYYY-MM-DD HH:mm:ss' or natural language like 'tomorrow at 3pm'",
        },
        list: {
          type: "string",
          description: "Optional name of the reminders list to add to",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_reminders",
    description: "List all reminders or reminders from a specific list",
    inputSchema: {
      type: "object",
      properties: {
        list: {
          type: "string",
          description: "Optional name of the reminders list to show",
        },
      },
    },
  },
  {
    name: "list_reminder_lists",
    description: "List all reminder lists",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Helper function to write debug logs to stderr
function debugLog(...args: any[]) {
  console.error("[DEBUG]", ...args);
}

// Helper function to execute AppleScript
function runAppleScript(script: string): string {
  try {
    return execSync(`osascript -e '${script}'`).toString().trim();
  } catch (error) {
    debugLog("AppleScript error:", error);
    throw error;
  }
}

// Helper function to parse natural language date using moment
function parseDate(dateStr: string): string {
  try {
    // First try parsing as exact date
    let parsedDate = moment(dateStr);

    // If not valid, try parsing as natural language
    if (!parsedDate.isValid()) {
      parsedDate = moment(new Date(dateStr));
    }

    // If still not valid, throw error
    if (!parsedDate.isValid()) {
      throw new Error("Invalid date format");
    }

    // Format date for AppleScript in a simpler format
    return parsedDate.format("M/D/YYYY H:mm:ss");
  } catch (error) {
    debugLog("Date parsing error:", error);
    throw new Error("Invalid date format");
  }
}

async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
  debugLog(`Handling tool call: ${name} with args:`, args);

  switch (name) {
    case "create_reminder": {
      try {
        let script = 'tell application "Reminders"\n';

        // If list is specified, target that list
        if (args.list) {
          script += `set targetList to list "${args.list}"\n`;
        } else {
          script += "set targetList to default list\n";
        }

        script += "make new reminder at end of targetList\n";
        script += `set name of result to "${args.title}"\n`;

        if (args.dueDate) {
          const parsedDate = parseDate(args.dueDate);
          debugLog("Parsed date:", parsedDate);
          script += `set due date of result to date "${parsedDate}"\n`;
        }

        script += "end tell";

        debugLog("Running AppleScript:", script);
        runAppleScript(script);
        return {
          content: [
            {
              type: "text",
              text: `Successfully created reminder: ${args.title}`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create reminder: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "list_reminders": {
      try {
        let script = 'tell application "Reminders"\n';

        if (args.list) {
          script += `set reminderList to list "${args.list}"\n`;
        } else {
          script += "set reminderList to default list\n";
        }

        script += "set reminderNames to {}\n";
        script += "repeat with r in (reminders in reminderList whose completed is false)\n";
        script += "set end of reminderNames to {name:name of r, due:due date of r}\n";
        script += "end repeat\n";
        script += "return reminderNames\n";
        script += "end tell";

        const result = runAppleScript(script);
        return {
          content: [
            {
              type: "text",
              text: `Active reminders:\n${result}`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list reminders: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "list_reminder_lists": {
      try {
        const script = `
          tell application "Reminders"
            set listNames to {}
            repeat with l in lists
              set end of listNames to name of l
            end repeat
            return listNames
          end tell
        `;
        const result = runAppleScript(script);
        return {
          content: [
            {
              type: "text",
              text: `Available reminder lists:\n${result}`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to list reminder lists: ${(error as Error).message}`,
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
            type: "text",
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
  }
}

// Create and configure server
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Setup request handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "reminders://lists",
      mimeType: "text/plain",
      name: "Available Reminder Lists",
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri.toString();

  if (uri === "reminders://lists") {
    const script = `
      tell application "Reminders"
        set listNames to {}
        repeat with l in lists
          set end of listNames to name of l
        end repeat
        return listNames
      end tell
    `;
    const lists = runAppleScript(script);
    return {
      contents: [
        {
          uri,
          mimeType: "text/plain",
          text: lists,
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) =>
  handleToolCall(request.params.name, request.params.arguments ?? {})
);

// Server startup function
async function runServer() {
  try {
    debugLog(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    debugLog("Server started successfully");
  } catch (error) {
    debugLog("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
runServer().catch((error) => {
  debugLog("Unhandled error:", error);
  process.exit(1);
});
