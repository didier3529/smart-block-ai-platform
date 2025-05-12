"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
}

export function TutorialProgress({ 
  currentStep, 
  totalSteps, 
  completedSteps,
  onStepClick 
}: TutorialProgressProps) {
  // Calculate overall progress percentage
  const progressPercentage = (completedSteps.length / totalSteps) * 100;

  return (
    <Card className="w-full bg-background/60 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepId = `step-${index + 1}`;
            const isCompleted = completedSteps.includes(stepId);
            const isCurrent = index + 1 === currentStep;
            
            return (
              <div
                key={stepId}
                className={`
                  h-2 rounded-full cursor-pointer transition-colors
                  ${isCompleted ? 'bg-primary' : isCurrent ? 'bg-primary/50' : 'bg-muted'}
                `}
                onClick={() => onStepClick?.(stepId)}
                role="button"
                aria-label={`Step ${index + 1}`}
              />
            );
          })}
        </div>

        {/* Step List */}
        <div className="space-y-2">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index + 1 === currentStep;
            
            return (
              <div
                key={step.id}
                className={`
                  flex items-center space-x-3 p-2 rounded-lg cursor-pointer
                  ${isCompleted ? 'text-primary' : isCurrent ? 'bg-muted' : 'text-muted-foreground'}
                `}
                onClick={() => onStepClick?.(step.id)}
              >
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                `}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span>{step.title}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Import from OnboardingSystem or create a shared constants file
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
  },
  {
    id: 'wallet',
    title: 'Connect Wallet',
  },
  {
    id: 'agents',
    title: 'Choose AI Agents',
  },
  {
    id: 'portfolio',
    title: 'Portfolio Setup',
  },
  {
    id: 'analysis',
    title: 'Analysis Features',
  },
]; 