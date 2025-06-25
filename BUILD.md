# Build Instructions

MCP server for Apple Reminders using hybrid TypeScript/Swift architecture.

## Quick Start

```bash
# Complete build (recommended)
npm run build

# Development
npm run dev

# Tests
npm test
```

## Prerequisites

- **macOS** (required for Swift compilation and Apple Reminders access)
- **Node.js** 18+
- **Xcode Command Line Tools**: `xcode-select --install`

## Build Commands

```bash
npm run build        # Build everything (Swift + TypeScript)
npm run build:swift  # Compile Swift binary only
npm run build:ts     # Compile TypeScript only
npm run clean        # Clean build artifacts
```

## Architecture

### Components
- **Swift Binary**: `src/swift/GetReminders.swift` → `dist/swift/bin/GetReminders`
  - Native EventKit access for reading reminders
- **TypeScript**: `src/**/*.ts` → `dist/**/*.js`
  - MCP server logic and API handling

### Binary Discovery
Auto-searches these paths:
1. `dist/swift/bin/GetReminders` (primary)
2. `src/swift/bin/GetReminders` (development)
3. `swift/bin/GetReminders` (alternative)

## Troubleshooting

### Binary Not Found
```bash
npm run build:swift
ls -la dist/swift/bin/GetReminders
chmod +x dist/swift/bin/GetReminders
```

### Swift Compiler Missing
```bash
xcode-select --install
swiftc --version
```

### Permissions
```bash
chmod +x src/swift/build.sh scripts/build.sh
```

## Development Workflow

1. **Initial setup**: `npm run build:swift` (once)
2. **Development**: `npm run dev` (TypeScript watch mode)
3. **Testing**: `npm test`
4. **Swift changes**: Rebuild with `npm run build:swift`

## Distribution

- Run `npm run build` before publishing
- `postinstall` hook builds binary automatically
- Include both `dist/` and Swift source in packages