#!/bin/bash

set -e  # Exit on any error

# Set the directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/bin"
SOURCE_FILE="$SCRIPT_DIR/GetReminders.swift"
OUTPUT_FILE="$BIN_DIR/GetReminders"

echo "🔨 Building Swift binary for Apple Reminders MCP Server..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This project requires macOS to compile Swift binaries"
    echo "   Current OS: $OSTYPE"
    exit 1
fi

# Check if Swift compiler exists
if ! command -v swiftc &> /dev/null; then
    echo "❌ Error: Swift compiler (swiftc) not found"
    echo "   Please install Xcode or Xcode Command Line Tools:"
    echo "   xcode-select --install"
    exit 1
fi

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: Source file not found: $SOURCE_FILE"
    exit 1
fi

# Ensure bin directory exists
mkdir -p "$BIN_DIR"

# Compile the Swift file
echo "📦 Compiling $SOURCE_FILE..."
swiftc -o "$OUTPUT_FILE" "$SOURCE_FILE" -framework EventKit -framework Foundation

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful! Binary saved to $OUTPUT_FILE"
    
    # Make the binary executable
    chmod +x "$OUTPUT_FILE"
    
    # Verify the binary works
    if "$OUTPUT_FILE" --help &>/dev/null || [ $? -eq 1 ]; then
        echo "✅ Binary is executable and working"
    else
        echo "⚠️  Warning: Binary compiled but may not be working correctly"
    fi
    
    echo "🎉 Swift binary build complete!"
else
    echo "❌ Compilation failed!"
    exit 1
fi 