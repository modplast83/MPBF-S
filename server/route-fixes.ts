// Comprehensive type fixes for routes compilation errors
import { Request, Response } from 'express';

// Helper function to safely validate and cast request bodies
export function validateAndCast<T>(schema: any, body: any): T {
  const validated = schema.parse(body);
  return validated as T;
}

// Safe property access with fallback
export function safeProperty<T>(obj: any, property: string, fallback?: T): T | undefined {
  return obj?.[property] ?? fallback;
}

// Type-safe request parameter validation
export function validateParams(req: Request, requiredParams: string[]): boolean {
  return requiredParams.every(param => req.params[param] !== undefined);
}

// Generic error response helper
export function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

// Type assertion for any validated data
export function assertType<T>(data: any): T {
  return data as T;
}