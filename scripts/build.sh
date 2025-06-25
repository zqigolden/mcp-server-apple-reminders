#!/bin/bash

set -e  # Exit on any error

echo "🚀 Building MCP Server Apple Reminders..."

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📁 Project root: $PROJECT_ROOT"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This project requires macOS to compile Swift binaries"
    echo "   Current OS: $OSTYPE"
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$PROJECT_ROOT/dist"

# Build Swift binary first
echo "🔨 Building Swift binary..."
cd "$PROJECT_ROOT"
npm run build:swift

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build:ts

# Verify the build
echo "✅ Verifying build..."

# Check if dist directory exists
if [ ! -d "$PROJECT_ROOT/dist" ]; then
    echo "❌ Error: dist directory not found"
    exit 1
fi

# Check if TypeScript compiled correctly
if [ ! -f "$PROJECT_ROOT/dist/index.js" ]; then
    echo "❌ Error: TypeScript compilation failed - index.js not found"
    exit 1
fi

# Check if Swift binary exists
if [ ! -f "$PROJECT_ROOT/dist/swift/bin/GetReminders" ]; then
    echo "❌ Error: Swift binary not found in dist directory"
    exit 1
fi

# Check if Swift binary is executable
if [ ! -x "$PROJECT_ROOT/dist/swift/bin/GetReminders" ]; then
    echo "❌ Error: Swift binary is not executable"
    exit 1
fi

echo "🎉 Build complete!"
echo ""
echo "📋 Build summary:"
echo "  ✅ TypeScript compiled to dist/"
echo "  ✅ Swift binary available at dist/swift/bin/GetReminders"
echo "  ✅ Ready to run: npm start"
echo ""