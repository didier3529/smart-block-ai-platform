"use client";

import { useState, useCallback, useEffect } from 'react';

interface TutorialProgressState {
  currentStep: number;
  completedSteps: string[];
  isComplete: boolean;
}

interface UseTutorialProgressOptions {
  totalSteps: number;
  onComplete?: () => void;
  persistKey?: string;
}

export function useTutorialProgress({
  totalSteps,
  onComplete,
  persistKey = 'tutorial-progress'
}: UseTutorialProgressOptions) {
  // Initialize state from localStorage if available
  const [state, setState] = useState<TutorialProgressState>(() => {
    if (typeof window === 'undefined') return {
      currentStep: 1,
      completedSteps: [],
      isComplete: false
    };

    const saved = localStorage.getItem(persistKey);
    return saved ? JSON.parse(saved) : {
      currentStep: 1,
      completedSteps: [],
      isComplete: false
    };
  });

  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(persistKey, JSON.stringify(state));
    }
  }, [state, persistKey]);

  // Handle step completion
  const completeStep = useCallback((stepId: string) => {
    setState(prev => {
      const newCompletedSteps = [...new Set([...prev.completedSteps, stepId])];
      const isComplete = newCompletedSteps.length === totalSteps;
      
      if (isComplete && !prev.isComplete && onComplete) {
        onComplete();
      }

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        isComplete
      };
    });
  }, [totalSteps, onComplete]);

  // Navigate to specific step
  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > totalSteps) return;
    setState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, [totalSteps]);

  // Move to next step
  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep >= totalSteps) return prev;
      return {
        ...prev,
        currentStep: prev.currentStep + 1
      };
    });
  }, [totalSteps]);

  // Move to previous step
  const previousStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep <= 1) return prev;
      return {
        ...prev,
        currentStep: prev.currentStep - 1
      };
    });
  }, []);

  // Reset progress
  const resetProgress = useCallback(() => {
    setState({
      currentStep: 1,
      completedSteps: [],
      isComplete: false
    });
  }, []);

  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    isComplete: state.isComplete,
    completeStep,
    goToStep,
    nextStep,
    previousStep,
    resetProgress
  };
} 