import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'mpbf_replit_auth_key', // fallback for dev
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow non-HTTPS in development
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  try {
    // Check if the user's ID (sub) maps to a valid field in your database
    // The sub field is the user's unique Replit ID
    const userId = claims["sub"];
    
    // Check if the user already exists to preserve their role
    const existingUser = await storage.getUser(userId);
    
    // Then upsert (insert or update) the user details
    const userData = {
      id: userId,
      username: claims["username"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      bio: claims["bio"],
      profileImageUrl: claims["profile_image_url"],
      // Keep existing role if it's an update or set default role
      role: existingUser?.role || "user", // Preserve existing role or set default for new users
      isActive: true, // Assume active by default
      // Preserve other fields if user exists
      phone: existingUser?.phone || null,
      sectionId: existingUser?.sectionId || null,
    };
    
    const user = await storage.upsertUser(userData);
    
    console.log("User upserted successfully:", userId, claims["username"]);
    return user;
  } catch (error) {
    console.error("Error upserting user:", error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    } catch (error) {
      console.error("Authentication error:", error);
      verified(error as Error);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `${protocol}://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    console.log("Initiating Replit Auth login flow");
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("Received callback from Replit Auth");
    
    // Get redirectURL from session if available
    const redirectAfterLogin = req.session.redirectAfterLogin || "/";
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: redirectAfterLogin,
      failureRedirect: "/auth",
      failureMessage: "Authentication failed with Replit Auth",
    })(req, res, next);
  });
  
  // Store redirect URL for after login completes
  app.get("/api/set-redirect", (req, res) => {
    const { redirectTo } = req.query;
    if (redirectTo && typeof redirectTo === 'string') {
      req.session.redirectAfterLogin = redirectTo;
      console.log("Set redirect after login to:", redirectTo);
    }
    res.json({ success: true });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // User info endpoint with explicit route binding to prevent vite interference
  const userEndpoint = async (req: any, res: any) => {
    try {
      console.log("GET /api/auth/user - Authenticated request received");
      console.log("User claims:", req.user?.claims);
      
      const userId = req.user.claims.sub;
      console.log("Looking up user with ID:", userId);
      
      const user = await storage.getUser(userId);
      console.log("User found in database:", !!user);
      
      // Forcefully set explicit content type and prevent further middleware processing
      res.setHeader('Content-Type', 'application/json');
      
      if (user) {
        console.log("Returning user data");
        return res.status(200).json(user);
      } else {
        console.log("User not found in database");
        return res.status(404).json({ message: "User not found in the database" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      // Forcefully set explicit content type and prevent further middleware processing
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        message: "Failed to fetch user",
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  };
  
  // Register the endpoint with explicit content type middleware
  app.get("/api/auth/user", isAuthenticated, (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  }, userEndpoint);
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For development, log authentication process
  console.log("Authentication check, isAuthenticated:", req.isAuthenticated());

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  console.log("User object exists:", !!user);
  
  if (!user.claims || !user.claims.sub) {
    console.error("Missing user claims or sub:", user);
    return res.status(401).json({ message: "Invalid user claims" });
  }
  
  if (!user.expires_at) {
    console.error("Missing expires_at in user session:", user);
    return res.status(401).json({ message: "Invalid session expiration" });
  }

  const now = Math.floor(Date.now() / 1000);
  console.log("Token expiry check:", now, user.expires_at, now <= user.expires_at);
  
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired, try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.error("Missing refresh token");
    // Check if this is an API request or a browser request
    const isApiRequest = req.xhr || req.path.startsWith('/api/');
    if (isApiRequest) {
      return res.status(401).json({ message: "Authentication token expired, please login again" });
    } else {
      return res.redirect("/api/login");
    }
  }

  try {
    console.log("Attempting token refresh");
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log("Token refresh successful");
    return next();
  } catch (error) {
    console.error("Token refresh error:", error);
    // Check if this is an API request or a browser request
    const isApiRequest = req.xhr || req.path.startsWith('/api/');
    if (isApiRequest) {
      return res.status(401).json({ message: "Token refresh failed, please login again" });
    } else {
      return res.redirect("/api/login");
    }
  }
};