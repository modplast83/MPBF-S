import { Express } from "express";
import { User } from "@shared/schema";
import { setupAuth as setupReplitAuth } from "./replitAuth";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  // Use Replit Auth implementation
  setupReplitAuth(app);
}