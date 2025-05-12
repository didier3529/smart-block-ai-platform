/**
 * Utility function to generate unique IDs
 */

let counter = 0;

/**
 * Generates a unique ID with an optional prefix
 * Format: prefix_timestamp_counter
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}_${timestamp}_${counter}`;
} 