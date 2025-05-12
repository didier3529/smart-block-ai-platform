// Type-safe wrapper for localStorage
const isBrowser = typeof window !== 'undefined';

/**
 * Get a value from localStorage with type safety
 * @param key The key to retrieve from localStorage
 * @returns The value from localStorage, or null if not found
 */
export const getLocalStorage = (key: string): string | null => {
  if (!isBrowser) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage: ${error}`);
    return null;
  }
};

/**
 * Set a value in localStorage with type safety
 * @param key The key to set in localStorage
 * @param value The value to store
 * @returns true if successful, false otherwise
 */
export const setLocalStorage = (key: string, value: string): boolean => {
  if (!isBrowser) {
    return false;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage: ${error}`);
    return false;
  }
};

/**
 * Remove a value from localStorage
 * @param key The key to remove from localStorage
 * @returns true if successful, false otherwise
 */
export const removeLocalStorage = (key: string): boolean => {
  if (!isBrowser) {
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
    return false;
  }
};

/**
 * Clear all values from localStorage
 * @returns true if successful, false otherwise
 */
export const clearLocalStorage = (): boolean => {
  if (!isBrowser) {
    return false;
  }
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error(`Error clearing localStorage: ${error}`);
    return false;
  }
}; 