# Apple Reminders MCP Server

A MCP server for interacting with Apple Reminders.

## Features

- List all reminders and reminder lists
- Create new reminders
- Mark reminders as complete/incomplete
- Add notes to reminders
- Set due dates for reminders

## Prerequisites

- Node.js 18 or later
- macOS (required for Apple Reminders integration)
- Xcode Command Line Tools

## Installation

```bash
npm install
```

## Building

First, build the Swift binary that interfaces with Apple Reminders:

```bash
npm run build:swift
```

Then build the TypeScript code:

```bash
npm run build
```

## Setup

Run the setup script to configure the server:

```bash
npm run setup
```

## Running Tests

```bash
npm test
```

## Usage

Start the server:

```bash
npm start
```

## Development

This project uses:

- TypeScript for type safety
- Jest for testing
- Swift for native macOS integration

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
