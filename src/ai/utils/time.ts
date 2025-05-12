/**
 * Time-related utility functions
 */

/**
 * Returns a promise that resolves after the specified delay
 * @param ms Delay in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Measures the execution time of an async operation
 * @param operation The async operation to measure
 * @returns A tuple containing the operation result and the execution time in milliseconds
 */
export async function measureTime<T>(
  operation: () => Promise<T>
): Promise<[T, number]> {
  const start = Date.now();
  const result = await operation();
  const duration = Date.now() - start;
  return [result, duration];
}

/**
 * Creates a timeout promise that rejects after the specified time
 * @param ms Timeout in milliseconds
 * @param message Optional error message
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  let timeoutId: NodeJS.Timeout;
  
  return new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message || `Operation timed out after ${ms}ms`));
    }, ms);
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Executes an operation with a timeout
 * @param operation The async operation to execute
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Optional timeout error message
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> {
  let operationPromise: Promise<T>;
  let cleanup: (() => void) | undefined;

  try {
    operationPromise = operation();
    
    // If the operation returns a promise with a cancel method, store it
    if (operationPromise && typeof (operationPromise as any).cancel === 'function') {
      cleanup = () => (operationPromise as any).cancel();
    }

    const result = await Promise.race([
      operationPromise,
      createTimeout(timeoutMs, timeoutMessage)
    ]);

    return result;
  } catch (error) {
    // If timeout occurred and we have a cleanup function, call it
    if (error instanceof Error && error.message.includes('timed out') && cleanup) {
      cleanup();
    }
    throw error;
  }
} 