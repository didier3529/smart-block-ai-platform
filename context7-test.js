// Simple test script for Context7
const fs = require('fs');

console.log('Starting Context7 test script');
console.log('Current directory:', process.cwd());
console.log('Checking if @upstash/context7-mcp is installed...');

try {
  const pkg = require('./node_modules/@upstash/context7-mcp/package.json');
  console.log('Found package:', pkg.name, pkg.version);
  
  console.log('\nChecking TypeScript errors from build...');
  // This is a simple test to see if we can work with files
  const buildErrorSample = 
`./src/ai/core/PromptManager.ts
Attempted import error: 'PromptError' is not exported from '../types/prompts' (imported as 'PromptError').`;

  console.log('\nSample error identified:');
  console.log(buildErrorSample);
  
  console.log('\nRecommended fix:');
  console.log('1. Export PromptError from src/ai/types/prompts.ts');
  console.log('2. Add: export { PromptError } from "./errors";');
  console.log('   Or define the type directly in prompts.ts');
  
  console.log('\nContext7 MCP test completed');
} catch (error) {
  console.error('Error:', error.message);
} 