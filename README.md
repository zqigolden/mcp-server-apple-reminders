# mcp-server-apple-reminders

![](https://img.shields.io/badge/A%20FRAD%20PRODUCT-WIP-yellow) [![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

An MCP server for interacting with Apple Reminders on macOS. This server provides tools to create and manage reminders through the Model Context Protocol.

## Features

- Create new reminders with titles and optional due dates
- Attach notes to reminders
- List all reminders or reminders from a specific list
- List all available reminder lists
- Natural language date parsing support
- **Native Swift integration for better performance and reliability**

## Requirements

- macOS with Apple Reminders app
- [Bun](https://bun.sh) runtime
- Node.js and TypeScript support
- Swift compiler (swiftc) for native components

## Installation

1. Install dependencies:

```bash
bun install
```

2. Build Swift components:

```bash
bun run build:swift
```

3. Run the setup script:

```bash
bun run setup.ts
```

This will add the server to your Claude MCP configuration.

## Available Tools

1. `create_reminder`
   - Create a new reminder with title and optional due date
   - Parameters:
     - `title`: Title of the reminder (required)
     - `dueDate`: Optional due date in format 'YYYY-MM-DD HH:mm:ss' (e.g., "2025-03-12 10:00:00")
     - `list`: Optional name of the reminders list
     - `note`: Optional note text to attach to the reminder

2. `list_reminders`
   - List all reminders or reminders from a specific list
   - Parameters:
     - `list`: Optional name of the reminders list to show
     - `showCompleted`: Optional boolean to show completed reminders (default: false)

3. `list_reminder_lists`
   - List all available reminder lists
   - No parameters required

## Project Structure

```
.
├── bin/                        # Compiled binaries
├── src/                        # Source code
│   ├── index.ts                # Application entry point
│   ├── server/                 # Server configuration
│   ├── tools/                  # MCP tools implementation
│   │   ├── index.ts            # Tools exports
│   │   ├── definitions.ts      # Tool definitions and schemas
│   │   ├── handlers.ts         # Tool implementation logic
│   │   └── handlers.test.ts    # Tool tests
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   │   ├── reminders.ts        # Core reminders functionality
│   │   ├── logger.ts           # Logging utilities
│   │   ├── applescript.ts      # AppleScript integration
│   │   └── date.ts             # Date parsing utilities
│   └── swift/                  # Native Swift integration
│       ├── bin/                # Compiled Swift binaries
│       ├── GetReminders.swift  # Swift source for reminders
│       ├── build.sh            # Swift build script
│       └── Info.plist          # macOS permissions config
├── package.json                # Project and dependency config
├── setup.ts                    # MCP server setup script
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

## Tech Stack

- [Bun](https://bun.sh) - JavaScript runtime
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) - Server implementation
- [Swift](https://swift.org) - Native integration with Apple's EventKit

## License

MIT License

Copyright (c) 2024 Frad Lee

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
