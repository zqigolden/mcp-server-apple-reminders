# mcp-server-apple-reminders

![](https://img.shields.io/badge/A%20FRAD%20PRODUCT-WIP-yellow) [![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

An MCP server for interacting with Apple Reminders on macOS. This server provides tools to create and manage reminders through the Model Context Protocol.

## Features

- Create new reminders with titles and optional due dates
- Attach notes to reminders
- List all reminders or reminders from a specific list
- List all available reminder lists
- Natural language date parsing support

## Installation

To install dependencies:

```bash
bun install
```

## Setup

Run the setup script to configure the MCP server:

```bash
bun run setup.ts
```

This will add the server to your Claude MCP configuration.

### Available Tools

1. `create_reminder`

   - Create a new reminder with title and optional due date
   - Parameters:
     - `title`: Title of the reminder (required)
     - `dueDate`: Optional due date (e.g., "tomorrow at 3pm")
     - `list`: Optional name of the reminders list
     - `note`: Optional note text to attach to the reminder

2. `list_reminders`

   - List all reminders or reminders from a specific list
   - Parameters:
     - `list`: Optional name of the reminders list to show

3. `list_reminder_lists`
   - List all available reminder lists
   - No parameters required

## Requirements

- macOS with Apple Reminders app
- [Bun](https://bun.sh) runtime
- Node.js TypeScript support

## Development

This project uses:

- [Bun](https://bun.sh) as the JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) for server implementation

### Project Structure

```
src/
  ├── index.ts              # Entry point
  ├── server/               # Server configuration
  │   ├── server.ts         # Server setup and startup
  │   └── handlers.ts       # Request handlers
  ├── tools/                # MCP tools
  │   ├── definitions.ts    # Tool definitions
  │   ├── handlers.ts       # Tool handler
  │   └── index.ts          # Tools export
  ├── utils/                # Utility functions
  │   ├── applescript.ts    # AppleScript utilities
  │   ├── date.ts           # Date parsing utilities
  │   └── logger.ts         # Logging utilities
  └── types/                # Type definitions
      └── index.ts
```

## License

MIT License

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
