#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildProduction() {
  try {
    console.log('Creating production build...');

    // Create dist directory
    mkdirSync('dist', { recursive: true });

    // Build frontend assets first
    console.log('Building frontend assets...');
    execSync('npx vite build --mode production', { 
      stdio: 'inherit',
      timeout: 60000 
    });

    // Create a simplified production server
    const productionServer = `#!/usr/bin/env node
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Serve static frontend files
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));

// Basic API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found');
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const port = parseInt(process.env.PORT || "5000");
app.listen(port, "0.0.0.0", () => {
  console.log(\`Production server running on port \${port}\`);
});
`;

    // Write the production server
    writeFileSync(join('dist', 'server.js'), productionServer);

    // Create the main entry point
    const entryPoint = `#!/usr/bin/env node
import './server.js';
`;
    writeFileSync(join('dist', 'index.js'), entryPoint);

    // Create package.json for ES modules
    const packageJson = {
      type: 'module',
      main: 'index.js'
    };
    writeFileSync(join('dist', 'package.json'), JSON.stringify(packageJson, null, 2));

    console.log('Production build completed successfully!');
    console.log('Files created in dist/:');
    execSync('ls -la dist/', { stdio: 'inherit' });

  } catch (error) {
    console.error('Production build failed:', error);
    process.exit(1);
  }
}

buildProduction();