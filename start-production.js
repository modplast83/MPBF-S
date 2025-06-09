#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure we're in production mode
process.env.NODE_ENV = 'production';

// Set the port for deployment
const port = process.env.PORT || 5000;
process.env.PORT = port.toString();

console.log(`Starting production server on port ${port}...`);

// Check if build exists
const buildPath = join(__dirname, 'dist', 'index.js');
if (!existsSync(buildPath)) {
  console.error('Build not found. Please run the build process first.');
  process.exit(1);
}

// Import and start the server
try {
  await import('./dist/index.js');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}