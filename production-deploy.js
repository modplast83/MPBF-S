#!/usr/bin/env node

import { build } from 'esbuild';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';

async function buildProductionServer() {
  try {
    console.log('Building production server...');
    
    // Clean and prepare dist directory
    if (existsSync('dist')) {
      rmSync('dist', { recursive: true, force: true });
    }
    mkdirSync('dist', { recursive: true });

    // Build only the server with ES module support
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outfile: 'dist/server.js',
      packages: 'external',
      mainFields: ['module', 'main'],
      conditions: ['import', 'node'],
      banner: {
        js: `// Production ES Module Server
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
      ]
    });

    // Create production entry point that handles deployment requirements
    const entryScript = `#!/usr/bin/env node
// Production deployment entry point
process.env.NODE_ENV = 'production';

// Configure port for Replit deployment
const PORT = process.env.PORT || 5000;
process.env.PORT = PORT.toString();

console.log('Starting production server...');
console.log('Port:', PORT);
console.log('Environment:', process.env.NODE_ENV);

// Import the server
import('./server.js').catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
`;

    writeFileSync('dist/index.js', entryScript);

    // Create package.json with proper ES module configuration
    const packageJson = {
      type: 'module',
      main: 'index.js',
      scripts: {
        start: 'node index.js'
      },
      engines: {
        node: '>=18.0.0'
      }
    };
    writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));

    console.log('Production server build completed!');
    console.log('Ready for deployment with ES module support');
    
  } catch (error) {
    console.error('Production build failed:', error);
    process.exit(1);
  }
}

buildProductionServer();