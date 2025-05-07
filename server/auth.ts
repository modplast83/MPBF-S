import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { User } from "@shared/schema";
import { storage } from "./storage";
import { comparePasswords, hashPassword } from "./auth-utils";
import crypto from "crypto";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'mpbf_session_secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      sameSite: 'lax',
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        // Verify password
        const isPasswordValid = await comparePasswords(password, user.password || "");
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create new user
      const newUser = await storage.createUser({
        id: crypto.randomUUID(),
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        role: "user",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Log in the user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        
        // Ensure response is properly initialized before using json method
        if (typeof res.json !== 'function') {
          console.error('Response object does not have json method');
          res.setHeader('Content-Type', 'application/json');
          const jsonData = JSON.stringify(userWithoutPassword);
          return res.end(jsonData);
        }
        
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        
        // Ensure response is properly initialized before using json method
        if (typeof res.json !== 'function') {
          console.error('Response object does not have json method');
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ message: "Logout failed" }));
        }
        
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Ensure response is properly initialized before using json method
      if (typeof res.json !== 'function') {
        console.error('Response object does not have json method');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ message: "Logged out successfully" }));
      }
      
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      // Ensure response is properly initialized before using json method
      if (typeof res.json !== 'function') {
        console.error('Response object does not have json method');
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ message: "Not authenticated" }));
      }
      
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = req.user as User;
    
    // Ensure response is properly initialized before using json method
    if (typeof res.json !== 'function') {
      console.error('Response object does not have json method');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(userWithoutPassword));
    }
    
    res.json(userWithoutPassword);
  });
}