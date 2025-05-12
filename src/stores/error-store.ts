import { create } from 'zustand';
import { ErrorCategory } from '../types/errors';

export interface ErrorEntry {
  id: string;
  message: string;
  category: ErrorCategory;
  timestamp: Date;
  resolved: boolean;
  details?: Record<string, unknown>;
}

interface ErrorStore {
  errors: ErrorEntry[];
  addError: (error: Omit<ErrorEntry, 'id' | 'timestamp' | 'resolved'>) => void;
  resolveError: (errorId: string) => void;
  clearErrors: () => void;
  getErrorsByCategory: (category: ErrorCategory) => ErrorEntry[];
  getActiveErrors: () => ErrorEntry[];
}

export const useErrorStore = create<ErrorStore>((set, get) => ({
  errors: [],

  addError: (error) => set((state) => ({
    errors: [
      ...state.errors,
      {
        ...error,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        resolved: false
      }
    ]
  })),

  resolveError: (errorId) => set((state) => ({
    errors: state.errors.map(error =>
      error.id === errorId ? { ...error, resolved: true } : error
    )
  })),

  clearErrors: () => set((state) => ({
    errors: state.errors.filter(error => !error.resolved)
  })),

  getErrorsByCategory: (category) => {
    return get().errors.filter(error => error.category === category);
  },

  getActiveErrors: () => {
    return get().errors.filter(error => !error.resolved);
  }
})); 