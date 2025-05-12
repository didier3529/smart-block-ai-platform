@echo off

REM Set test environment variables
set NODE_ENV=test
set MODEL=test-model
set MAX_TOKENS=1000
set TEMPERATURE=0.7
set DEBUG=false
set LOG_LEVEL=error

REM Run integration tests
echo Running AI Agent System Integration Tests...
call jest src/ai/core/__tests__/integration.test.ts --verbose

REM Cleanup
set NODE_ENV=
set MODEL=
set MAX_TOKENS=
set TEMPERATURE=
set DEBUG=
set LOG_LEVEL= 