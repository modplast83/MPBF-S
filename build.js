#!/usr/bin/env node

import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';

async function buildProject() {
  try {
    // Create dist directory
    mkdirSync('dist', { recursive: true });

    // Build server for production with explicit TypeScript entry
    console.log('Building server for production...');
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outfile: 'dist/index.js',
      packages: 'external',
      tsconfig: 'tsconfig.json',
      banner: {
        js: `// Production server - ES Module
import { createRequire } from 'module';
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
        'memorystore'
      ],
      loader: {
        '.ts': 'ts'
      }
    });

    // Create package.json in dist for proper ES module handling
    const distPackageJson = {
      type: 'module'
    };
    writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));

    console.log('Server build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildProject();