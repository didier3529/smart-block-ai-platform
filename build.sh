#!/usr/bin/env bash

# Exit on error
set -e

# Print Node.js version
echo "Using Node.js version:"
node -v

# Remove Windows-specific dependencies if they exist
if [ -d "node_modules/@next/swc-win32-x64-msvc" ]; then
  echo "Removing Windows-specific SWC binary..."
  rm -rf node_modules/@next/swc-win32-x64-msvc
fi

# Install dependencies
npm ci

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!" 