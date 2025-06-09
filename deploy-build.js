#!/usr/bin/env node

import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';

async function buildForDeployment() {
  try {
    console.log('Building for deployment...');
    
    // Clean and create dist directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Build server only (frontend will be built separately by Replit)
    console.log('Building server...');
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outfile: 'dist/index.js',
      packages: 'external',
      mainFields: ['module', 'main'],
      conditions: ['import', 'node'],
      banner: {
        js: `import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);`
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      external: [
        'express',
        'pg',
        'drizzle-orm',
        '@neondatabase/serverless',
        'express-session',
        'passport',
        'passport-local',
        'connect-pg-simple',
        'express-fileupload',
        '@sendgrid/mail',
        'twilio',
        'bcrypt',
        'uuid',
        'memorystore',
        'ws'
      ]
    });

    // Create proper package.json for ES modules
    const packageJson = {
      type: 'module',
      main: 'index.js',
      scripts: {
        start: 'node index.js'
      }
    };
    writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));

    console.log('Deployment build completed successfully!');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildForDeployment();