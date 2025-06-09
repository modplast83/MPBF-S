#!/usr/bin/env node

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Enable trust proxy for deployment environment
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS headers for deployment
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

// Basic API endpoints for deployment testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Production API is working', port: process.env.PORT || 5000 });
});

// Serve static files from dist (if they exist)
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Serve static files from client dist (fallback)
const clientDistPath = join(__dirname, 'client', 'dist');
if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  // Try multiple possible index.html locations
  const indexPaths = [
    join(distPath, 'index.html'),
    join(clientDistPath, 'index.html'),
    join(__dirname, 'index.html')
  ];
  
  for (const indexPath of indexPaths) {
    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // Fallback response
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Production Management System</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <div id="root">
        <h1>Production Management System</h1>
        <p>Server is running in production mode on port ${process.env.PORT || 5000}</p>
        <p>Environment: ${process.env.NODE_ENV || 'production'}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </div>
    </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Production server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ 
      message: 'Internal Server Error',
      environment: 'production'
    });
  }
});

// Start server
const port = parseInt(process.env.PORT || "5000");
app.listen(port, "0.0.0.0", () => {
  console.log(`Production server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Time: ${new Date().toISOString()}`);
});