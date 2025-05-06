import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { hashPassword, comparePasswords } from "./auth-utils";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  // Set up session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "supersecretkey", // In production, use env var
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production only
      sameSite: 'none' // Allow cross-site cookies
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Authenticating user with username: ${username}`);
        
        // Convert username to lowercase for case-insensitive comparison
        let user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User ${username} not found in database`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`User found, comparing passwords for ${username}`);
        const passwordValid = await comparePasswords(password, user.password);
        
        if (!passwordValid) {
          console.log(`Invalid password for user ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Don't return password in session
        const { password: _, ...userWithoutPassword } = user;
        console.log(`Authentication successful for ${username}`);
        return done(null, userWithoutPassword as SelectUser);
      } catch (error) {
        console.error(`Authentication error for ${username}:`, error);
        return done(error);
      }
    })
  );

  // Serialize and deserialize user for session
  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    console.log("Deserializing user ID:", id);
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found during deserialization:", id);
        return done(null, false);
      }
      
      console.log("User successfully deserialized:", user.username);
      
      // Don't return password to client
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword as SelectUser);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Log in the user automatically after registration
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password back to client
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt for username:", req.body.username);
    
    // Validate request body
    if (!req.body.username || !req.body.password) {
      console.log("Missing username or password in request");
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    try {
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Login error:", err);
          // Return explicit error instead of passing to next middleware
          return res.status(500).json({ message: "Authentication error occurred. Please try again." });
        }
        
        if (!user) {
          console.log("Authentication failed:", info?.message || "Unknown reason");
          return res.status(401).json({ message: info?.message || "Authentication failed" });
        }
        
        console.log("User authenticated successfully:", user.username);
        
        req.login(user, (err) => {
          if (err) {
            console.error("Session error:", err);
            return res.status(500).json({ message: "Error establishing session. Please try again." });
          }
          console.log("Login successful, session established");
          return res.json(user);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Unexpected error during login:", error);
      res.status(500).json({ message: "An unexpected error occurred. Please try again later." });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}