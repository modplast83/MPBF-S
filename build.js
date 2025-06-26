#!/usr/bin/env node

import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';

async function buildProject() {
  try {
    console.log('Starting production build...');
    
    // Clean dist directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // First run vite build for frontend
    console.log('Building frontend...');
    execSync('vite build', { stdio: 'inherit' });
    
    // Move assets from dist/public to dist if needed
    if (existsSync('dist/public')) {
      console.log('Moving frontend assets to correct location...');
      execSync('cp -r dist/public/* dist/ 2>/dev/null || true', { stdio: 'inherit' });
      execSync('rm -rf dist/public', { stdio: 'inherit' });
    }

    // Build server for production with explicit ES module configuration
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
      mainFields: ['module', 'main'],
      conditions: ['import'],
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
        'memorystore',
        'ws'
      ],
      loader: {
        '.ts': 'ts',
        '.js': 'js'
      },
      resolveExtensions: ['.ts', '.js', '.mjs'],
      metafile: true
    });

    // Create package.json in dist for proper ES module handling
    const distPackageJson = {
      type: 'module',
      main: 'index.js',
      engines: {
        node: '>=18.0.0'
      }
    };
    writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));

    // Create a startup script that ensures proper port binding
    const startupScript = `#!/usr/bin/env node
// Deployment startup script
process.env.NODE_ENV = 'production';

// Ensure port is set correctly for deployment
const port = process.env.PORT || 5000;
process.env.PORT = port.toString();

console.log('Starting production server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);

// Import the main server
import('./index.js').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
`;
    writeFileSync('dist/start.js', startupScript);

    console.log('Build completed successfully!');
    console.log('Files created in dist/:');
    try {
      execSync('ls -la dist/', { stdio: 'inherit' });
    } catch (e) {
      // Fallback for non-unix systems
      console.log('Dist directory contents created');
    }

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildProject();