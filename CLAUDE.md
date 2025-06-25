# CLAUDE.md

AI assistant guidance for Apple Reminders MCP server codebase.

## Essential Commands

```bash
npm run build     # REQUIRED before starting server (builds Swift binary)
npm run dev       # TypeScript watch mode
npm test          # Run test suite
npm start         # Start MCP server
npm run clean     # Clean build artifacts
```

## Critical Requirements

### Swift Binary
- **MUST run `npm run build` before server startup**
- Binary: `dist/swift/bin/GetReminders` (EventKit access)
- Tests mock binary path (`NODE_ENV=test`)
- Auto-discovery fallbacks: `src/swift/bin/`, `swift/bin/`

### Architecture
**MCP Server** (`src/server/`) + **Tools** (`src/tools/`) + **Swift Binary** (`src/swift/`)

**Dual Strategy:**
- **Read**: Swift + EventKit → `dist/swift/bin/GetReminders`  
- **Write**: AppleScript → `tell application "Reminders"`

## MCP Tools Reference

| Tool | Parameters | Purpose |
|------|------------|---------|
| `create_reminder` | title, dueDate?, list?, note? | Create new reminder |
| `list_reminders` | list?, showCompleted? | List reminders with filters |
| `list_reminder_lists` | none | Get all reminder lists |
| `update_reminder` | title, newTitle?, dueDate?, list?, note? | Update existing reminder |
| `delete_reminder` | title, list? | Delete reminder by title |
| `move_reminder` | title, fromList?, toList | Move between lists |

## Key Implementation Details

### Date Handling (Moment.js)
- **Input formats**: ISO_8601, 'YYYY-MM-DD', 'MM/DD/YYYY', 'YYYY-MM-DD HH:mm:ss'
- **AppleScript output**: "MM/DD/YYYY HH:mm:ss"

### Error Handling
- **JSON responses**: `{isError: boolean, message: string, data?: any}`
- **Child process**: Swift binary execution errors
- **Validation**: Zod + ArkType schema validation

### File Locations
- **Entry**: `src/index.ts` (package.json auto-discovery)
- **MCP Server**: `src/server/` (@modelcontextprotocol/sdk)
- **Tools**: `src/tools/handlers.ts` (tool implementations)
- **Utils**: `src/utils/` (reminders, AppleScript, date, logger)
- **Tests**: `src/**/*.test.ts` (Jest + ts-jest)

### Testing Environment
- **Config**: `jest.config.mjs`
- **Setup**: `src/test-setup.ts`
- **Mocking**: Swift binary paths when `NODE_ENV=test`

### Permissions
- **EventKit**: Reading reminders (macOS 10.15+)
- **Automation**: AppleScript execution