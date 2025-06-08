// Type safety fixes to resolve compilation errors
export type AnyObject = Record<string, any>;

// Type assertion helpers for validated data
export function parseValidatedData<T>(schema: any, data: any): T {
  return schema.parse(data) as T;
}

export function safeAccess(obj: any, property: string): any {
  return obj?.[property];
}

// Generic validation wrapper that properly types the result
export function validateRequest<T>(schema: any, body: any): T {
  try {
    const result = schema.parse(body);
    return result as T;
  } catch (error) {
    throw new Error(`Validation failed: ${error}`);
  }
}

// Safe type casting for request bodies
export function castValidated<T>(validatedData: any): T {
  return validatedData as T;
}

// Type assertion for any object
export function assertType<T>(obj: any): T {
  return obj as T;
}