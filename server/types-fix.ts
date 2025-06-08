// Temporary type fixes to resolve compilation errors
export type AnyObject = Record<string, any>;

// Type assertion helpers
export function parseValidatedData<T>(schema: any, data: any): T {
  return schema.parse(data) as T;
}

export function safeAccess(obj: any, property: string): any {
  return obj?.[property];
}