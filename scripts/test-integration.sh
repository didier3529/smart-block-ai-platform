#!/bin/bash

# Set test environment variables
export NODE_ENV=test
export MODEL=test-model
export MAX_TOKENS=1000
export TEMPERATURE=0.7
export DEBUG=false
export LOG_LEVEL=error

# Run integration tests
echo "Running AI Agent System Integration Tests..."
jest src/ai/core/__tests__/integration.test.ts --verbose

# Cleanup
unset NODE_ENV
unset MODEL
unset MAX_TOKENS
unset TEMPERATURE
unset DEBUG
unset LOG_LEVEL 