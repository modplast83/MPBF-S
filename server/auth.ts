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
    interface User {
      id: string;
      username: string;
      isAdmin: boolean;
      sectionId?: string | null;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    }
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'mpbf_session_secret',
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
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
        
        return done(null, {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin || false,
          sectionId: user.sectionId || undefined,
          email: user.email || undefined,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined
        });
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
      done(null, {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
        sectionId: user.sectionId || undefined,
        email: user.email || undefined,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined
      });
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
        isAdmin: false,
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
    console.log("Login attempt for user:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info?.message);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return next(err);
        }
        
        console.log("User logged in successfully:", user.username);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        
        // Set a cache control header to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        
        // Send the response
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    console.log("Logout request received");
    
    if (!req.isAuthenticated()) {
      console.log("Logout attempted for non-authenticated session");
      return res.status(200).json({ message: "No session to log out" });
    }
    
    const username = (req.user as User)?.username || 'unknown';
    console.log(`Logging out user: ${username}`);
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Explicitly destroy the session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).json({ message: "Error destroying session" });
          }
          
          // Clear the session cookie
          res.clearCookie('connect.sid', { 
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
          
          console.log(`User ${username} logged out successfully`);
          return res.status(200).json({ message: "Logged out successfully" });
        });
      } else {
        console.log(`User ${username} logged out successfully (no session to destroy)`);
        return res.status(200).json({ message: "Logged out successfully" });
      }
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    // Set cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    if (!req.isAuthenticated()) {
      console.log("Attempt to get user data with unauthenticated session");
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const username = (req.user as User)?.username || 'unknown';
    console.log(`Getting user data for: ${username}`);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = req.user as User;
    
    // Send the response
    return res.status(200).json(userWithoutPassword);
  });
}