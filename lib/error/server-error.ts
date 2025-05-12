export class ServerError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message)
    this.name = 'ServerError'
  }
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError
}

export function handleServerError(error: unknown) {
  // Log the error
  console.error('Server error:', error)

  // If it's already a ServerError, return it
  if (isServerError(error)) {
    return error
  }

  // Convert unknown errors to ServerError
  if (error instanceof Error) {
    return new ServerError(error.message)
  }

  // Handle non-Error objects
  return new ServerError('An unexpected error occurred')
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => Promise<T> | T
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (errorHandler) {
      return await errorHandler(error)
    }
    throw handleServerError(error)
  }
} 