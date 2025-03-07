// dbUtils.ts - Utility functions for database operations

/**
 * Converts an object with camelCase keys to snake_case keys
 * @param obj - The object with camelCase keys
 * @returns A new object with snake_case keys
 */
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  if (!obj) return obj;
  
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      // Handle nested objects and arrays
      if (obj[key] !== null && typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          result[snakeKey] = obj[key].map((item: any) => 
            typeof item === 'object' && item !== null ? toSnakeCase(item) : item
          );
        } else {
          result[snakeKey] = toSnakeCase(obj[key]);
        }
      } else {
        result[snakeKey] = obj[key];
      }
    }
  }
  
  return result;
}

/**
 * Converts an object with snake_case keys to camelCase keys
 * @param obj - The object with snake_case keys
 * @returns A new object with camelCase keys
 */
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  if (!obj) return obj;
  
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, p1) => p1.toUpperCase());
      
      // Handle nested objects and arrays
      if (obj[key] !== null && typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          result[camelKey] = obj[key].map((item: any) => 
            typeof item === 'object' && item !== null ? toCamelCase(item) : item
          );
        } else {
          result[camelKey] = toCamelCase(obj[key]);
        }
      } else {
        result[camelKey] = obj[key];
      }
    }
  }
  
  return result;
}