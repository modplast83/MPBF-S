#!/usr/bin/env node

// Deployment entry point - ensures proper ES module execution
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

// Configure port for Replit deployment (maps to external port 80)
const port = process.env.PORT || 5000;
process.env.PORT = port.toString();

console.log('=== Production Deployment Start ===');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);
console.log(`Node version: ${process.version}`);
console.log('===================================');

// Import and start the production server
try {
  await import('./dist/index.js');
} catch (error) {
  console.error('Failed to start production server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}