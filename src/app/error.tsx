'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="p-4 border border-red-500 rounded-lg bg-red-50">
      <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong!</h2>
      <p className="text-red-600 mb-4">{error.message}</p>
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
} 