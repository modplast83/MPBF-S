#!/usr/bin/env node

import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

async function buildProject() {
  try {
    // Create dist directory
    mkdirSync('dist', { recursive: true });

    // Build server with proper ES module configuration  
    console.log('Building server for production...');
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outfile: 'dist/server.mjs',
      packages: 'external',
      banner: {
        js: '// ES Module server build'
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      external: [
        'express',
        'pg',
        'drizzle-orm',
        '@neondatabase/serverless'
      ]
    });

    // Create entry point that imports the server
    const entryContent = `#!/usr/bin/env node
import './server.mjs';
`;
    writeFileSync('dist/index.js', entryContent);

    // Create package.json in dist to ensure proper ES module handling
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