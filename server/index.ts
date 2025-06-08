import express, { type Request, Response, NextFunction } from "express";
import fileUpload from "express-fileupload";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Enable trust proxy for Replit's environment
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  useTempFiles: false,
  abortOnLimit: true,
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true
}));

// Add CORS headers for cross-domain requests
app.use((req, res, next) => {
  // Accept requests from any domain
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Add special middleware for auth API routes to ensure proper content-type
app.use('/api/auth', (req, res, next) => {
  console.log(`Intercepted auth API request: ${req.path}`);
  
  // Capture the original send method
  const originalSend = res.send;
  
  // Override the send method to ensure JSON content type
  res.send = function(body) {
    // Only modify JSON responses
    if (typeof body === 'object') {
      res.setHeader('Content-Type', 'application/json');
      return originalSend.call(this, JSON.stringify(body));
    }
    return originalSend.call(this, body);
  };
  
  // Override the JSON method
  const originalJson = res.json;
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, body);
  };
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Error handler caught: ${err.stack || err}`);
    
    // Send the error response but don't rethrow the error
    // This prevents unhandled exceptions
    if (!res.headersSent) {
      // Set explicit content type to ensure JSON
      res.setHeader('Content-Type', 'application/json');
      res.status(status).json({ message });
    }
  });

  // DO NOT add the catch-all handler here - it was causing all API requests to 404
  // Instead, we'll rely on the explicit Content-Type headers we've added to each route

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use dynamic port allocation to avoid conflicts
  const startPort = parseInt((process.env.PORT || 5000).toString());
  
  function tryStartServer(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen({
        port: port,
        host: "0.0.0.0",
      }, () => {
        log(`serving on port ${port}`);
        resolve();
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying ${port + 1}`);
          tryStartServer(port + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }
  
  await tryStartServer(startPort);
})();
