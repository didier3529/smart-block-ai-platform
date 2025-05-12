import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure nonce
 * @param length Length of the nonce in bytes (default: 32)
 * @returns Hex string representation of the nonce
 */
export function generateNonce(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Validates a timestamp is within an acceptable range
 * @param timestamp Timestamp to validate
 * @param maxAge Maximum age in milliseconds (default: 5 minutes)
 * @returns boolean indicating if timestamp is valid
 */
export function isValidTimestamp(
  timestamp: number,
  maxAge: number = 5 * 60 * 1000
): boolean {
  const now = Date.now();
  return timestamp > now - maxAge && timestamp <= now;
}

/**
 * Safely compares two strings in constant time
 * @param a First string
 * @param b Second string
 * @returns boolean indicating if strings are equal
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
} 