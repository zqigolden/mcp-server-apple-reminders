#!/bin/bash

# Set the directory paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/bin"
SOURCE_FILE="$SCRIPT_DIR/GetReminders.swift"
OUTPUT_FILE="$BIN_DIR/GetReminders"

# Ensure bin directory exists
mkdir -p "$BIN_DIR"

# Compile the Swift file
echo "Compiling $SOURCE_FILE..."
swiftc -o "$OUTPUT_FILE" "$SOURCE_FILE"

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "Compilation successful! Binary saved to $OUTPUT_FILE"
    
    # Make the binary executable
    chmod +x "$OUTPUT_FILE"
    
    echo "Binary is now executable"
else
    echo "Compilation failed!"
    exit 1
fi 